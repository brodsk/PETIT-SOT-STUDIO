import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("petit_sot_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body?.imageDataUrl) {
      return NextResponse.json(
        { error: "Artwork image is required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in Vercel." },
        { status: 503 },
      );
    }

    const imageDataUrl = String(body.imageDataUrl);
    const match = imageDataUrl.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/,
    );

    if (!match) {
      return NextResponse.json(
        { error: "Invalid artwork image data. Please choose the image again." },
        { status: 400 },
      );
    }

    const [, mimeType, base64Image] = match;

    const metadata = [
      body.title && "Название: " + body.title,
      body.year && "Год: " + body.year,
      body.medium && "Материал / техника: " + body.medium,
      body.width_cm &&
        body.height_cm &&
        "Размер: " + body.width_cm + " × " + body.height_cm + " см",
      body.depth_cm && "Глубина: " + body.depth_cm + " см",
    ]
      .filter(Boolean)
      .join("\n");

    const prompt =
      "You are writing a refined contemporary-art catalogue description for PETIT.SOT STUDIO and artist Olga Trikhleb.\n\n" +
      "Look carefully at the supplied artwork image. Describe only what can reasonably be observed: composition, forms, palette, material appearance, gesture, texture, spatial relationships and visual atmosphere. Do not invent symbolism, biography, provenance, dimensions, medium, date or facts. Metadata supplied below is factual and may be used only as given.\n\n" +
      "Write TWO versions of the same catalogue description:\n" +
      "1. Russian: 90–150 words, elegant and restrained.\n" +
      "2. English: a faithful, natural translation of the Russian version, also 90–150 words.\n\n" +
      'Avoid clichés, exaggerated claims, art-world jargon and phrases like "invites the viewer". Do not mention that you are AI.\n\n' +
      'Return ONLY valid JSON in exactly this shape: {"ru":"Russian description","en":"English description"}\n\n' +
      "Metadata:\n" +
      metadata;

    // Keep the model configurable, but never let an old/invalid Vercel value
    // break the feature. These are stable multimodal Gemini models.
    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const models = Array.from(new Set([
      configuredModel,
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash-lite",
    ].filter(Boolean))) as string[];

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType.toLowerCase(),
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 900,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            ru: { type: "STRING" },
            en: { type: "STRING" },
          },
          required: ["ru", "en"],
        },
      },
    };

    let responseText = "";
    let lastGeminiError = "";

    for (const model of models) {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(model) +
          ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        },
      );

      responseText = await response.text();
      if (response.ok) break;

      lastGeminiError = `${model}: ${responseText.slice(0, 1000)}`;
      responseText = "";
    }


