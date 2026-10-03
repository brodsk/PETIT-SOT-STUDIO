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
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  if (!title && !description) return NextResponse.json({ titleEn: "", descriptionEn: "" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured in Vercel." }, { status: 503 });

  const prompt = `You are translating a contemporary-art catalogue entry from Russian into natural, elegant English.\n\nCRITICAL TITLE RULE: The artwork title MUST be translated into English. Never copy the Russian/Cyrillic title into titleEn. If the Russian title is a normal word or phrase, use its natural English equivalent (for example: "Дорога" -> "Road", "Осень" -> "Autumn", "Тишина" -> "Silence"). Do not transliterate Russian words when an English equivalent exists.\n\nTranslate the description faithfully. Do not invent information. Preserve meaning, tone, and paragraph structure. Return ONLY valid JSON in exactly this shape: {"titleEn":"...","descriptionEn":"..."}.\n\nRussian title: ${title}\n\nRussian description:\n${description}`;

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700, responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "Gemini translation failed.", detail: (await response.text()).slice(0, 1000) }, { status: 502 });
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.map((part:any) => part.text).filter(Boolean).join("").trim() || "";
  try {
    const parsed = JSON.parse(raw);
    const titleEn = String(parsed.titleEn || "").trim();\n    const descriptionEn = String(parsed.descriptionEn || "").trim();\n    if (!titleEn || /[А-Яа-яЁё]/.test(titleEn)) {\n      return NextResponse.json({ error: "Gemini did not return a valid English artwork title.", detail: titleEn }, { status: 502 });\n    }\n    return NextResponse.json({ titleEn, descriptionEn: descriptionEn || description });
  } catch {
    return NextResponse.json({ error: "Gemini returned invalid translation.", detail: raw.slice(0, 1000) }, { status: 502 });
  }
}
