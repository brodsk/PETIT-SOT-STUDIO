import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase
    .from("petit_sot_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (!body.imageDataUrl) {
    return NextResponse.json({ error: "Artwork image is required." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in Vercel." },
      { status: 503 },
    );
  }

  // The browser sends a data URL. Gemini REST expects the raw base64
  // bytes separately from the MIME type.
  const match = String(body.imageDataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) {
    return NextResponse.json(
      { error: "Invalid artwork image data. Please choose the image again." },
      { status: 400 },
    );
  }

  const mimeType = match[1].toLowerCase();
  const base64Image = match[2];

  const metadata = [
    body.title && `Title: ${body.title}`,
    body.year && `Year: ${body.year}`,
    body.medium && `Medium: ${body.medium}`,
    body.width_cm && body.height_cm && `Dimensions: ${body.width_cm} × ${body.height_cm} cm`,
    body.depth_cm && `Depth: ${body.depth_cm} cm`,
  ].filter(Boolean).join("\n");

  const prompt = `You are writing a refined contemporary-art catalogue description for PETIT.SOT STUDIO and artist Olga Trikhleb.

Look carefully at the supplied artwork image. Describe only what can reasonably be observed: composition, forms, palette, material appearance, gesture, texture, spatial relationships and visual atmosphere. Do not invent symbolism, biography, provenance, dimensions, medium, date or facts. Metadata supplied below is factual and may be used only as given.

Write 90–150 words in elegant but restrained English. Avoid clichés, exaggerated claims, art-world jargon and phrases like "invites the viewer". Do not mention that you are AI.

${metadata}`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: "Gemini request failed.", detail: detail.slice(0, 1000) },
      { status: 502 },
    );
  }

  const data = await response.json();

  const description = data.candidates
    ?.flatMap((candidate: any) => candidate.content?.parts || [])
    ?.map((part: any) => part.text)
    ?.filter(Boolean)
    ?.join("\n")
    ?.trim() || "";

  if (!description) {
    return NextResponse.json(
      { error: "Gemini returned no description.", detail: JSON.stringify(data).slice(0, 1000) },
      { status: 502 },
    );
  }

  return NextResponse.json({ description });
}
