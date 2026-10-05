import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const STYLE_PROMPTS: Record<string,string> = {
  minimal: "a quiet contemporary gallery-like apartment with warm ivory walls, natural daylight, restrained furniture, clean architectural lines, and generous negative space",
  modern: "a refined modern European apartment with neutral stone, light oak, sculptural furniture, soft daylight, and an editorial interior-design feel",
  warm: "a warm sophisticated home with natural oak, textured plaster, linen, muted earth tones, soft afternoon light, and understated furniture",
  luxury: "a high-end contemporary interior with travertine or limestone, dark wood accents, refined furniture, subtle art-book styling, and controlled cinematic light",
};

async function requireAdmin(){
  const supabase = await createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if(!user) return {supabase,allowed:false};
  const {data:admin} = await supabase.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  return {supabase,allowed:Boolean(admin)};
}

export async function POST(request:Request){
  const {supabase,allowed} = await requireAdmin();
  if(!allowed) return NextResponse.json({error:"Forbidden"},{status:403});

  try{
    const body = await request.json();
    const artworkId = String(body?.artworkId||"").trim();
    const style = String(body?.style||"minimal").trim().toLowerCase();
    const customPrompt = String(body?.customPrompt||"").trim().slice(0,1200);
    if(!artworkId) return NextResponse.json({error:"Artwork is required."},{status:400});

    const {data:artwork,error:artworkError} = await supabase
      .from("petit_sot_artworks")
      .select("id,title,width_cm,height_cm,depth_cm,image_path")
      .eq("id",artworkId)
      .single();
    if(artworkError||!artwork) return NextResponse.json({error:"Artwork not found."},{status:404});
    if(!artwork.image_path) return NextResponse.json({error:"The artwork needs a main image first."},{status:400});

    const hfToken = process.env.HF_TOKEN;
    if(!hfToken) return NextResponse.json({error:"HF_TOKEN is not configured."},{status:503});

    const publicUrl = supabase.storage.from("petit-sot-artworks").getPublicUrl(artwork.image_path).data.publicUrl;
    const sourceResponse = await fetch(publicUrl,{cache:"no-store"});
    if(!sourceResponse.ok) return NextResponse.json({error:"Could not read the artwork image."},{status:502});
    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
    if(sourceBuffer.length>12*1024*1024) return NextResponse.json({error:"The artwork image is too large for AI generation."},{status:413});
    const mimeType = (sourceResponse.headers.get("content-type")||"image/jpeg").split(";")[0];
    const base64 = sourceBuffer.toString("base64");

    const size = artwork.width_cm&&artwork.height_cm
      ? String(artwork.width_cm)+" × "+String(artwork.height_cm)+(artwork.depth_cm?" × "+String(artwork.depth_cm):"")+" cm"
      : "exact dimensions not provided";

    const styleText = STYLE_PROMPTS[style]||STYLE_PROMPTS.minimal;
    const prompt = [
      "Create a photorealistic interior-design mockup for PETIT.SOT STUDIO.",
      "The supplied image is the actual original artwork. Treat the artwork as a fixed, sacred reference.",
      "Do NOT repaint, reinterpret, restyle, crop, mirror, stretch, recolor, simplify, add, remove, or invent any part of the artwork.",
      "Preserve the artwork's exact visual content, aspect ratio, colors, marks, texture, and proportions. It must remain clearly recognizable as the same physical artwork.",
      "Artwork title: "+(artwork.title||"Untitled")+".",
      "Physical artwork size: "+size+". Use this dimension to make its scale against the wall and furniture believable.",
      "Interior direction: "+styleText+".",
      customPrompt?"Additional direction from the studio: "+customPrompt+".":"",
      "Show the artwork naturally mounted on a wall with realistic perspective, contact shadows, subtle frame behavior only if a frame is already visibly present, and physically plausible lighting.",
      "The room should support the artwork rather than compete with it. No people, no text, no logos, no extra paintings that resemble the supplied artwork.",
      "Create a premium editorial interior photograph suitable for an art gallery website.",
    ].filter(Boolean).join("\n");

    const hf = new InferenceClient(hfToken);
    let generated:Blob;
    try{
      generated = await hf.imageToImage({
        provider:"fal-ai",
        model:"black-forest-labs/FLUX.2-klein-4B",
        inputs:new Blob([sourceBuffer],{type:mimeType}),
        parameters:{prompt},
      });
    }catch(error:any){
      const message=error?.message||"Hugging Face image generation failed.";
      console.error("Hugging Face generation error",error);
      return NextResponse.json({error:"Image generation failed.",detail:message.slice(0,1200)},{status:502});
    }

    if(!generated||generated.size===0) return NextResponse.json({error:"The image model returned no image."},{status:502});

    const generatedMime=(generated.type||"image/jpeg").split(";")[0];
    const extension=generatedMime==="image/png"?"png":"jpg";
    const outputBuffer = Buffer.from(await generated.arrayBuffer());
    const path = "interiors/"+artworkId+"/"+crypto.randomUUID()+"."+extension;
    const upload = await supabase.storage.from("petit-sot-artworks").upload(path,outputBuffer,{contentType:generatedMime,upsert:false});
    if(upload.error) throw upload.error;

    const {data:row,error:insertError} = await supabase
      .from("petit_sot_artwork_interiors")
      .insert({artwork_id:artworkId,image_path:path,style,custom_prompt:customPrompt})
      .select()
      .single();
    if(insertError) throw insertError;

    const imageUrl = supabase.storage.from("petit-sot-artworks").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ok:true,interior:{...row,image_url:imageUrl}});
  }catch(error:any){
    console.error("Interior generation error",error);
    return NextResponse.json({error:error?.message||"Could not generate interior mockup."},{status:500});
  }
}
