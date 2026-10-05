import { NextResponse } from "next/server";
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

    const apiKey = process.env.GEMINI_API_KEY;
    if(!apiKey) return NextResponse.json({error:"GEMINI_API_KEY is not configured."},{status:503});

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

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
      body:JSON.stringify({
        model:process.env.GEMINI_IMAGE_MODEL||"gemini-3.1-flash-image",
        input:[
          {type:"text",text:prompt},
          {type:"image",mime_type:mimeType,data:base64},
        ],
        response_format:{type:"image",mime_type:"image/jpeg",aspect_ratio:"4:5",image_size:"1K"},
      }),
    });

    if(!response.ok) return NextResponse.json({error:"Image generation failed.",detail:(await response.text()).slice(0,1200)},{status:502});

    const data = await response.json();
    let outputBase64 = "";
    for(const step of data.steps||[]){
      for(const block of step.content||[]){
        if(block.type==="image"&&block.data){outputBase64=block.data;break;}
      }
      if(outputBase64) break;
    }
    if(!outputBase64&&data.output_image?.data) outputBase64=data.output_image.data;
    if(!outputBase64) return NextResponse.json({error:"The image model returned no image."},{status:502});

    const outputBuffer = Buffer.from(outputBase64,"base64");
    const path = "interiors/"+artworkId+"/"+crypto.randomUUID()+".jpg";
    const upload = await supabase.storage.from("petit-sot-artworks").upload(path,outputBuffer,{contentType:"image/jpeg",upsert:false});
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
