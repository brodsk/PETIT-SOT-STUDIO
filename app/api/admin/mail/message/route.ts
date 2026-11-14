import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { getZohoAccountContext, zohoRequest } from "../../../../../lib/zoho-mail";

export async function GET(request:Request) {
  await requireAdmin();
  try {
    const url=new URL(request.url);
    const folderId=url.searchParams.get("folderId");
    const messageId=url.searchParams.get("messageId");
    if(!folderId||!messageId)return NextResponse.json({error:"Missing message identifiers."},{status:400});
    const {accountId}=await getZohoAccountContext();
    const result=await zohoRequest("/api/accounts/"+encodeURIComponent(accountId)+"/folders/"+encodeURIComponent(folderId)+"/messages/"+encodeURIComponent(messageId)+"/content");
    return NextResponse.json({data:result?.data||result});
  } catch(error:any) {
    return NextResponse.json({error:error?.message||"Could not load message."},{status:500});
  }
}
