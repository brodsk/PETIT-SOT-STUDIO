import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { getZohoAccountContext, getZohoConnection, zohoRequest } from "../../../../../lib/zoho-mail";

export async function GET(request:Request) {
  await requireAdmin();
  try {
    const connection=await getZohoConnection();
    if(!connection?.account_id)return NextResponse.json({connected:false});
    const {accountId,accountEmail}=await getZohoAccountContext();
    const api="/api/accounts/"+encodeURIComponent(accountId);
    const [foldersResult]=await Promise.all([zohoRequest(api+"/folders")]);
    const folders=foldersResult?.data||[];
    const url=new URL(request.url);
    const requested=url.searchParams.get("folder");
    const folder=(requested?folders.find((f:any)=>String(f.folderId)===requested):null)
      || folders.find((f:any)=>String(f.folderType).toLowerCase()==="inbox")
      || folders[0];
    if(!folder)return NextResponse.json({connected:true,accountEmail,folders:[],messages:[],selectedFolder:null});
    const start=Math.max(1,Number(url.searchParams.get("start")||1));
    const limit=Math.min(50,Math.max(1,Number(url.searchParams.get("limit")||30)));
    const messagesResult=await zohoRequest(api+"/messages/view?"+new URLSearchParams({
      folderId:String(folder.folderId),start:String(start),limit:String(limit),status:"all"
    }));
    return NextResponse.json({connected:true,accountEmail,folders,messages:messagesResult?.data||[],selectedFolder:folder});
  } catch(error:any) {
    return NextResponse.json({error:error?.message||"Could not load Zoho Mail."},{status:500});
  }
}

export async function POST(request:Request) {
  await requireAdmin();
  try {
    const body=await request.json();
    const toAddress=String(body.to||"").trim();
    const subject=String(body.subject||"").trim();
    const content=String(body.content||"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddress))return NextResponse.json({error:"Укажите корректный адрес получателя."},{status:400});
    if(!subject)return NextResponse.json({error:"Укажите тему письма."},{status:400});
    if(!content)return NextResponse.json({error:"Текст письма пуст."},{status:400});
    const {accountId,accountEmail}=await getZohoAccountContext();
    const sender=String(body.from||"website@petitsot.com").trim();
    const result=await zohoRequest("/api/accounts/"+encodeURIComponent(accountId)+"/messages",{
      method:"POST",
      body:JSON.stringify({
        fromAddress:sender,
        toAddress,
        subject,
        content,
        mailFormat:"html",
        askReceipt:"no",
      }),
    });
    return NextResponse.json({success:true,data:result?.data||null});
  } catch(error:any) {
    return NextResponse.json({error:error?.message||"Не удалось отправить письмо."},{status:500});
  }
}
