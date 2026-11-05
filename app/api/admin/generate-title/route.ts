import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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
    if (!body?.imageDataUrl) {
      return NextResponse.json({ error: "Artwork image is required." }, { status: 400 });
    }

    const match = String(body.imageDataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
    if (!match) return NextResponse.json({ error: "Invalid artwork image data." }, { status: 400 });
    const [, mimeType, base64Image] = match;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured in Vercel." }, { status: 503 });

    const medium = String(body.medium || "").trim();
    const currentTitle = String(body.currentTitle || "").trim();
    const prompt =
      "You are an experienced contemporary-art curator helping PETIT.SOT STUDIO name an original painting by artist Olga Trikhleb. Study the attached image carefully and propose exactly THREE distinct, memorable artwork titles in Russian. " +
      "Titles should be concise (usually 1–5 words), evocative but restrained, specific to visible details, mood, color, light, composition or subject. Avoid generic clichés, excessive poetry, invented symbolism, claims about places or stories that cannot be inferred from the image, and titles that merely say 'Картина'. " +
      (medium ? "Known medium: " + medium + ". " : "") +
      (currentTitle ? "Existing title to avoid repeating: " + currentTitle + ". " : "") +
      "Return only valid JSON with one property named titles, whose value is an array of exactly three Russian strings. Do not include explanations.";

    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const models = Array.from(new Set([configuredModel, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"].filter(Boolean))) as string[];
    let responseText = "";
    let lastError = "";

    for (const model of models) {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType.toLowerCase(), data: base64Image } },
            ] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 250, responseMimeType: "application/json" },
          }),
        },
      );
      responseText = await response.text();
      if (response.ok) break;
      lastError = model + ": " + responseText.slice(0, 800);
      responseText = "";
    }

    if (!responseText) {
      return NextResponse.json({ error: "Gemini title generation failed.", detail: lastError || "No Gemini response." }, { status: 502 });
    }

    const data = JSON.parse(responseText);
    const raw = data.candidates?.[0]?.content?.parts?.map((part: any) => part.text).filter(Boolean).join("").trim() || "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    const titles = Array.isArray(parsed.titles)
      ? parsed.titles.map((value: unknown) => String(value || "").trim()).filter(Boolean).slice(0, 3)
      : [];
    if (titles.length !== 3) {
      return NextResponse.json({ error: "Gemini did not return three valid title suggestions.", detail: raw.slice(0, 800) }, { status: 502 });
    }
    return NextResponse.json({ titles });
  } catch (error) {
    console.error("Artwork title generation failed:", error);
    return NextResponse.json({
      error: "Artwork title generation failed.",
      detail: error instanceof Error ? error.message : "Unknown server error.",
    }, { status: 500 });
  }
}
