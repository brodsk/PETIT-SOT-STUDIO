import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase
    .from("petit_sot_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { data: w, error } = await supabase
    .from("petit_sot_artworks")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !w) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

  let cert = w.certificate_number;
  if (!cert) {
    cert = `PS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    await supabase.from("petit_sot_artworks").update({ certificate_number: cert }).eq("id", id);
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const fontUrl = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
  const italicUrl = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Italic.ttf";
  const [fontRes, italicRes] = await Promise.all([fetch(fontUrl), fetch(italicUrl)]);
  if (!fontRes.ok || !italicRes.ok) {
    return NextResponse.json({ error: "Could not load PDF fonts." }, { status: 502 });
  }
  const font = await pdf.embedFont(await fontRes.arrayBuffer());
  const italic = await pdf.embedFont(await italicRes.arrayBuffer());
  const black = rgb(0.09, 0.09, 0.09);

  page.drawText("PETIT.SOT STUDIO", { x: 44, y: 792, size: 14, font, color: black });
  page.drawText("CERTIFICATE / ARTWORK PASSPORT", { x: 44, y: 767, size: 8, font, color: rgb(.35, .35, .35) });

  let y = 720;
  if (w.image_path) {
    const imageUrl = supabase.storage.from("petit-sot-artworks").getPublicUrl(w.image_path).data.publicUrl;
    const imageRes = await fetch(imageUrl);
    if (imageRes.ok) {
      const imageBytes = await imageRes.arrayBuffer();
      const type = imageRes.headers.get("content-type") || "";
      const image = type.includes("png")
        ? await pdf.embedPng(imageBytes)
        : type.includes("jpeg") || type.includes("jpg")
          ? await pdf.embedJpg(imageBytes)
          : null;
      if (!image) {
        y = 720;
      } else {
      const scale = Math.min(507 / image.width, 420 / image.height);
        page.drawImage(image, {
          x: 44,
          y: y - 420,
          width: image.width * scale,
          height: image.height * scale,
        });
        y -= 445;
      }
    }
  }

  page.drawText(w.title, { x: 44, y, size: 27, font: italic, color: black });
  y -= 34;
  page.drawText(`Olga Trikhleb · ${w.year || "—"}`, { x: 44, y, size: 10, font, color: black });
  y -= 24;

  const dimensions = [w.width_cm, w.height_cm].filter(Boolean).join(" × ");
  const lines: [string, string][] = [
    ["Medium", w.medium || "—"],
    ["Dimensions", dimensions ? `${dimensions} cm` : "—"],
    ["Price", `€${Number(w.price_eur || 0).toFixed(2)}`],
    ["Certificate", cert],
  ];

  for (const [label, value] of lines) {
    page.drawText(label.toUpperCase(), { x: 44, y, size: 7, font, color: rgb(.4, .4, .4) });
    page.drawText(value, { x: 160, y, size: 10, font, color: black });
    y -= 19;
  }

  y -= 12;
  const desc = (w.description || w.ai_description || "").slice(0, 850);
  const words = desc.split(/\s+/);
  let line = "";
  const wrapped: string[] = [];

  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(next, 9) > 507) {
      wrapped.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) wrapped.push(line);

  for (const l of wrapped.slice(0, 10)) {
    page.drawText(l, { x: 44, y, size: 9, font, color: black });
    y -= 13;
  }

  page.drawText("PETIT.SOT STUDIO · Olga Trikhleb", {
    x: 44, y: 35, size: 7, font, color: rgb(.45, .45, .45),
  });
  page.drawText(new Date().toLocaleDateString("en-GB"), {
    x: 465, y: 35, size: 7, font, color: rgb(.45, .45, .45),
  });

  const pdfBytes = await pdf.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${w.slug}-passport.pdf"`,
    },
  });
}
