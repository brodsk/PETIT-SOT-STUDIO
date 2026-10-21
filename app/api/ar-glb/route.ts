import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_GLB_BYTES = 8 * 1024 * 1024;
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
  if (contentType !== "model/gltf-binary" && contentType !== "application/octet-stream") {
    return NextResponse.json({ error: "Expected a binary GLB model." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_GLB_BYTES) {
    return NextResponse.json({ error: "GLB model exceeds the 8 MB limit." }, { status: 413 });
  }

  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_GLB_BYTES) {
    return NextResponse.json({ error: "GLB model is empty or exceeds 8 MB." }, { status: 413 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const path = `${crypto.randomUUID()}.glb`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: "model/gltf-binary",
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("GLB storage upload failed:", error.message);
    return NextResponse.json(
      { error: "Could not store the AR model. Check that the public 'ar-models' storage bucket exists." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: new URL(`/api/ar-glb/${path}`, request.url).toString() });
}
