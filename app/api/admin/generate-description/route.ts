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

    // Do not feed form fields into the model request. Description generation
    // must depend only on the artwork image, so editing title/year/size/price
    // can never break the AI request.

    // Keep the model configurable, but never let an old/invalid Vercel value
    // break the feature. These are stable multimodal Gemini models.
    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const models = Array.from(new Set([
      configuredModel,
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
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

    if (!responseText) {
      return NextResponse.json(
        {
          error: "Gemini request failed.",
          detail: lastGeminiError || "No Gemini response.",
        },
        { status: 502 },
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned an invalid response.",
          detail: responseText.slice(0, 1000),
        },
        { status: 502 },
      );
    }

    const raw =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("")
        .trim() || "";

    if (!raw) {
      return NextResponse.json(
        {
          error: "Gemini returned no description.",
          detail: JSON.stringify(data).slice(0, 1500),
        },
        { status: 502 },
      );
    }

    try {
      const cleaned = raw
        .replace(/^\`\`\`json\s*/i, "")
        .replace(/^\`\`\`\s*/i, "")
        .replace(/\s*\`\`\`$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (
        typeof parsed.ru !== "string" ||
        typeof parsed.en !== "string" ||
        !parsed.ru.trim() ||
        !parsed.en.trim()
      ) {
        throw new Error("Missing bilingual description");
      }

      return NextResponse.json({
        description: parsed.ru.trim(),
        descriptionRu: parsed.ru.trim(),
        descriptionEn: parsed.en.trim(),
      });
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned an invalid bilingual description.",
          detail: raw.slice(0, 1500),
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Artwork description generation failed:", error);

    return NextResponse.json(
      {
        error: "Artwork description generation failed.",
        detail:
          error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 },
    );
  }
}    const prompt =
      "You are writing a refined contemporary-art catalogue description for PETIT.SOT STUDIO and artist Olga Trikhleb.\\n\\n" +
      "Look carefully at the supplied artwork image. Describe only what can reasonably be observed: composition, forms, palette, material appearance, gesture, texture, spatial relationships and visual atmosphere. Do not invent symbolism, biography, provenance, dimensions, medium, date or other facts.\\n\\n" +
      "Write TWO versions of the same catalogue description:\\n" +
      "1. Russian: 90–150 words, elegant and restrained.\\n" +
      "2. English: a faithful, natural translation of the Russian version, also 90–150 words.\\n\\n" +
      'Avoid clichés, exaggerated claims, art-world jargon and phrases like "invites the viewer". Do not mention that you are AI.\\n\\n' +
      'Return ONLY valid JSON in exactly this shape: {"ru":"Russian description","en":"English description"}';

    // Keep the model configurable, but never let an old/invalid Vercel value
    // break the feature. These are stable multimodal Gemini models.
    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const models = Array.from(new Set([
      configuredModel,
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
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

    if (!responseText) {
      return NextResponse.json(
        {
          error: "Gemini request failed.",
          detail: lastGeminiError || "No Gemini response.",
        },
        { status: 502 },
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned an invalid response.",
          detail: responseText.slice(0, 1000),
        },
        { status: 502 },
      );
    }

    const raw =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("")
        .trim() || "";

    if (!raw) {
      return NextResponse.json(
        {
          error: "Gemini returned no description.",
          detail: JSON.stringify(data).slice(0, 1500),
        },
        { status: 502 },
      );
    }

    try {
      const cleaned = raw
        .replace(/^\`\`\`json\s*/i, "")
        .replace(/^\`\`\`\s*/i, "")
        .replace(/\s*\`\`\`$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (
        typeof parsed.ru !== "string" ||
        typeof parsed.en !== "string" ||
        !parsed.ru.trim() ||
        !parsed.en.trim()
      ) {
        throw new Error("Missing bilingual description");
      }

      return NextResponse.json({
        description: parsed.ru.trim(),
        descriptionRu: parsed.ru.trim(),
        descriptionEn: parsed.en.trim(),
      });
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned an invalid bilingual description.",
          detail: raw.slice(0, 1500),
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Artwork description generation failed:", error);

    return NextResponse.json(
      {
        error: "Artwork description generation failed.",
        detail:
          error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 },
    );
  }
}
