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
    const sourceMime = (sourceResponse.headers.get("content-type")||"image/jpeg").split(";")[0];
    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
    if(sourceBuffer.length>12*1024*1024) return NextResponse.json({error:"The artwork image is too large for AI generation."},{status:413});
    const width = Number(artwork.width_cm);
    const height = Number(artwork.height_cm);
    const hasDimensions = Number.isFinite(width) && width>0 && Number.isFinite(height) && height>0;
    const aspectRatio = hasDimensions ? width/height : null;
    const orientation = aspectRatio
      ? aspectRatio>1.08 ? "landscape" : aspectRatio<0.92 ? "portrait" : "square"
      : "unknown";

    const size = hasDimensions
      ? String(artwork.width_cm)+" × "+String(artwork.height_cm)+(artwork.depth_cm?" × "+String(artwork.depth_cm):"")+" cm"
      : "exact dimensions not provided";

    const ratioText = aspectRatio
      ? "Exact artwork aspect ratio: "+width.toFixed(2)+" : "+height.toFixed(2)+" ("+aspectRatio.toFixed(3)+"), "+orientation+"."
      : "Artwork aspect ratio is not available from the database; preserve the source image ratio exactly.";

    // Give the model a concrete physical reference instead of relying on words like
    // "60 × 80 cm". A typical wall is treated as 400 × 270 cm (2.7 m ceiling).
    // This makes the requested artwork occupy a believable fraction of the wall.
    const referenceWallWidth = 400;
    const referenceWallHeight = 270;
    const wallWidthShare = hasDimensions ? Math.min(0.72, Math.max(0.08, width/referenceWallWidth)) : 0.24;
    const wallHeightShare = hasDimensions ? Math.min(0.72, Math.max(0.08, height/referenceWallHeight)) : 0.30;
    const scaleText = hasDimensions
      ? "Physical placement reference: use a 400 × 270 cm wall. The artwork should occupy about "+Math.round(wallWidthShare*100)+"% of the wall width and "+Math.round(wallHeightShare*100)+"% of the wall height. Preserve the artwork's "+width.toFixed(1)+" × "+height.toFixed(1)+" cm physical proportions."
      : "Use believable physical scale relative to a 400 × 270 cm reference wall.";

    const styleText = STYLE_PROMPTS[style]||STYLE_PROMPTS.minimal;
    const prompt = [
      "Create a photorealistic interior-design background for PETIT.SOT STUDIO.",
      "Generate the room around a single dedicated blank wall intended for one artwork that will be composited afterward.",
      "IMPORTANT: do not generate any paintings, posters, photographs, canvases, framed art, wall graphics, mirrors, or decorative artwork on the dedicated wall. Leave that wall completely empty.",
      "Use a mostly front-facing camera toward the dedicated wall so the final artwork can be placed on the wall without perspective distortion.",
      "The dedicated wall should occupy most of the image, with believable floor, furniture and architectural context around it.",
      "The final artwork will be inserted afterward at its exact physical scale. Do not reserve an oversized focal-art area and do not imply a large painting.",
      "Artwork title: "+(artwork.title||"Untitled")+" is provided only as metadata; do not render the title as text.",
      "Physical artwork dimensions for the later composite: "+size+".",
      ratioText,
      scaleText,
      "Treat the 400 × 270 cm wall reference as the composition scale: the empty wall must have believable real-world proportions.",
      "Do not generate a placeholder rectangle or fake artwork where the real artwork will go.",
      "Interior direction: "+styleText+".",
      customPrompt?"Additional direction from the studio: "+customPrompt+".":"",
      "The room should support the artwork rather than compete with it. No people, no text, no logos, no extra wall art.",
      "Create a premium editorial interior photograph suitable for an art gallery website.",
    ].filter(Boolean).join("\n");

    const hf = new InferenceClient(hfToken);
    let generated:Blob;
    try{
      generated = await hf.textToImage({
        provider:"fal-ai",
        model:"black-forest-labs/FLUX.2-klein-4B",
        inputs:prompt,
        parameters:{
          guidance_scale:4,
          num_inference_steps:4,
          width:1024,
          height:768,
        },
      });
    }catch(error:any){
      const message=error?.message||"Hugging Face image generation failed.";
      console.error("Hugging Face generation error",error);
      return NextResponse.json({error:"Image generation failed.",detail:message.slice(0,1200)},{status:502});
    }

    if(!generated||generated.size===0) return NextResponse.json({error:"The image model returned no image."},{status:502});

    const generatedBuffer = Buffer.from(await generated.arrayBuffer());
    const generatedMime = (generated.type||"image/jpeg").split(";")[0];

    // Do not ask the image model to determine the artwork's physical size.
    // Generate the room first, then compose the original artwork in SVG at a
    // deterministic pixel size derived from the real centimetre dimensions.
    // This avoids a native image-processing dependency and guarantees scale.
    const outputWidth = 1024;
    const outputHeight = 768;
    const wallWidthPx = 960;
    const wallHeightPx = 648;
    const wallTopPx = 30;

    const artWidthPx = hasDimensions
      ? Math.max(4,Math.round(wallWidthPx*(width/referenceWallWidth)))
      : 230;
    const artHeightPx = hasDimensions
      ? Math.max(4,Math.round(wallHeightPx*(height/referenceWallHeight)))
      : 300;
    const artLeftPx = Math.round((outputWidth-artWidthPx)/2);
    const artTopPx = Math.round(wallTopPx+(wallHeightPx-artHeightPx)*0.42);

    const backgroundData = generatedBuffer.toString("base64");
    const artworkData = sourceBuffer.toString("base64");
    const safeBackgroundMime = ["image/png","image/jpeg","image/jpg","image/webp","image/avif"].includes(generatedMime) ? generatedMime : "image/jpeg";
    const safeArtworkMime = ["image/png","image/jpeg","image/jpg","image/webp","image/avif"].includes(sourceMime) ? sourceMime : "image/jpeg";

    const shadowX = artLeftPx+3;
    const shadowY = artTopPx+5;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">
      <image href="data:${safeBackgroundMime};base64,${backgroundData}" x="0" y="0" width="${outputWidth}" height="${outputHeight}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="${shadowX}" y="${shadowY}" width="${artWidthPx}" height="${artHeightPx}" rx="1" fill="#000" opacity=".16"/>
      <image href="data:${safeArtworkMime};base64,${artworkData}" x="${artLeftPx}" y="${artTopPx}" width="${artWidthPx}" height="${artHeightPx}" preserveAspectRatio="xMidYMid meet"/>
    </svg>`;

    const outputBuffer = Buffer.from(svg);

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
