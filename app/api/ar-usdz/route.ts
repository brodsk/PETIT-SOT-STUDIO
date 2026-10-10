import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_USDZ_BYTES = 4 * 1024 * 1024;
const BUCKET = "ar-models";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "AR storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY in the server environment." },
      { status: 503 },
    );
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "model/vnd.usdz+zip" && contentType !== "application/octet-stream") {
    return NextResponse.json({ error: "Expected a USDZ model." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_USDZ_BYTES) {
    return NextResponse.json({ error: "USDZ model is too large (20 MB limit)." }, { status: 413 });
  }

  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_USDZ_BYTES) {
    return NextResponse.json({ error: "USDZ model is empty or exceeds 4 MB." }, { status: 413 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const path = `${crypto.randomUUID()}.usdz`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: "model/vnd.usdz+zip",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("USDZ storage upload failed:", uploadError.message);
    return NextResponse.json(
      { error: "Could not store the AR model. Check that the public 'ar-models' storage bucket exists." },
      { status: 502 },
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
