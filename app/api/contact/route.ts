import {NextResponse} from "next/server";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const name=String(body?.name||"").trim();
    const email=String(body?.email||"").trim();
    const message=String(body?.message||"").trim();
    const website=String(body?.website||"").trim();

    if(website)return NextResponse.json({ok:true});
    if(!name||name.length>80||!email||email.length>160||!message||message.length>4000){
      return NextResponse.json({error:"Invalid form data"},{status:400});
    }
    if(!/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email)){
      return NextResponse.json({error:"Invalid email"},{status:400});
    }

    const token=process.env.TELEGRAM_BOT_TOKEN;
    const primaryChatId=process.env.TELEGRAM_CHAT_ID;
    const additionalChatIds=String(process.env.TELEGRAM_ADDITIONAL_CHAT_IDS||"")
      .split(",")
      .map(id=>id.trim())
      .filter(Boolean);
    const chatIds=[primaryChatId,...additionalChatIds].filter(
      (id,index,arr):id is string=>Boolean(id)&&arr.indexOf(id)===index
    );

    if(!token||chatIds.length===0){
      console.error("Telegram contact form is not configured");
      return NextResponse.json({error:"Contact form is not configured"},{status:503});
    }

    const text=[
      "✦ PETIT.SOT — NEW CONTACT",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
      "",
      `Sent: ${new Date().toLocaleString("en-GB",{timeZone:"Europe/Bratislava"})}`,
    ].join("\n");

    const results=await Promise.all(
      chatIds.map(chatId=>fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({chat_id:chatId,text}),
      }))
    );

    const failed=results.findIndex(result=>!result.ok);
    if(failed!==-1){
      console.error("Telegram send failed",await results[failed].text());
      return NextResponse.json({error:"Telegram delivery failed"},{status:502});
    }

    return NextResponse.json({ok:true});
  }catch(error){
    console.error("Contact form error",error);
    return NextResponse.json({error:"Invalid request"},{status:400});
  }
}
