import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: admin } = await supabase.from("petit_sot_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.imageDataUrl) return NextResponse.json({ error: "Artwork image is required." }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured in Vercel." }, { status: 503 });

  const match = String(body.imageDataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) return NextResponse.json({ error: "Invalid artwork image data. Please choose the image again." }, { status: 400 });

  const metadata = [
    body.title && "Название: " + body.title,
    body.year && "Год: " + body.year,
    body.medium && "Материал / техника: " + body.medium,
    body.width_cm && body.height_cm && "Размер: " + body.width_cm + " × " + body.height_cm + " см",
    body.depth_cm && "Глубина: " + body.depth_cm + " см",
  ].filter(Boolean).join("\n");

  const prompt = "You are writing a refined contemporary-art catalogue description for PETIT.SOT STUDIO and artist Olga Trikhleb.\n\n" +
    "Look carefully at the supplied artwork image. Describe only what can reasonably be observed: composition, forms, palette, material appearance, gesture, texture, spatial relationships and visual atmosphere. Do not invent symbolism, biography, provenance, dimensions, medium, date or facts. Metadata supplied below is factual and may be used only as given.\n\n" +
    "Write TWO versions of the same catalogue description:\n1. Russian: 90–150 words, elegant and restrained.\n2. English: a faithful, natural translation of the Russian version, also 90–150 words.\n\n" +
    "Avoid clichés, exaggerated claims, art-world jargon and phrases like \"invites the viewer\". Do not mention that you are AI.\n\n" +
    "Return ONLY valid JSON in exactly this shape: {\"ru\":\"Russian description\",\"en\":\"English description\"}\n\nMetadata:\n" + metadata;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: match[1].toLowerCase(), data: match[2] } }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 900, responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) return NextResponse.json({ error: "Gemini request failed.", detail: (await response.text()).slice(0, 1000) }, { status: 502 });
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.map((part:any) => part.text).filter(Boolean).join("").trim() || "";
  if (!raw) return NextResponse.json({ error: "Gemini returned no description.", detail: JSON.stringify(data).slice(0, 1000) }, { status: 502 });

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.ru || !parsed.en) throw new Error("Missing bilingual description");
    return NextResponse.json({ description: parsed.ru, descriptionRu: parsed.ru, descriptionEn: parsed.en });
  } catch {
    return NextResponse.json({ error: "Gemini returned an invalid bilingual description.", detail: raw.slice(0, 1000) }, { status: 502 });
  }
}