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
    const description = String(body.description || "").trim();
    const year = String(body.year || "").trim();
    const width = String(body.width_cm || "").trim();
    const height = String(body.height_cm || "").trim();
    const depth = String(body.depth_cm || "").trim();
    const metadata = [
      medium ? "Medium / technique: " + medium : "",
      year ? "Year: " + year : "",
      width && height ? "Dimensions: " + width + " × " + height + (depth ? " × " + depth : "") + " cm" : "",
      description ? "Artist's artwork description: " + description : "",
    ].filter(Boolean).join("\\n");

    const prompt =
      "You are an expert art curator and SEO copywriter for PETIT.SOT STUDIO, representing original paintings by artist Olga Trikhleb. Study the image and use the supplied artwork description and factual metadata. " +
      "Return exactly THREE distinct title pairs. Each pair must contain titleRu (a short, natural Russian artwork name, usually 1–5 words) and titleEn (a polished English SEO title in this exact structure: \"Artwork Name — Original Oil Painting of [specific visible subject or scene] | PETIT.SOT\"). " +
      "Use \"Original Acrylic Painting\" for acrylic works, and \"Original Artwork\" for other media. " +
      "The English title must identify the actual subject, setting, atmosphere or composition as specifically as the image and description support. It may mention a place only when that place is explicitly stated in the description or metadata; never invent a location, story, symbolism, or technique. " +
      "Use natural search-friendly English, not keyword stuffing. Keep the artwork name elegant and memorable; do not make the whole title a generic description. " +
      (metadata ? "ARTWORK DETAILS:\\n" + metadata + "\\n" : "") +
      (currentTitle ? "Existing Russian title to avoid repeating: " + currentTitle + ". " : "") +
      "Example of the desired English style: \"Meadow — Original Oil Painting of a Mountain Landscape | PETIT.SOT\". " +
      "Return only valid JSON: {\"titles\":[{\"titleRu\":\"...\",\"titleEn\":\"...\"},{\"titleRu\":\"...\",\"titleEn\":\"...\"},{\"titleRu\":\"...\",\"titleEn\":\"...\"}]}. No explanations.";

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
      ? parsed.titles
          .map((value: any) => ({
            titleRu: String(value?.titleRu || "").trim(),
            titleEn: String(value?.titleEn || "").trim(),
          }))
          .filter((value: { titleRu: string; titleEn: string }) => value.titleRu && value.titleEn && !/[А-Яа-яЁё]/.test(value.titleEn))
          .slice(0, 3)
      : [];
    if (titles.length !== 3) {
      return NextResponse.json({ error: "Gemini did not return three valid bilingual title suggestions.", detail: raw.slice(0, 800) }, { status: 502 });
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
