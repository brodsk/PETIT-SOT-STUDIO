import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/admin";

const CONNECTION_ID = 1;
const SCOPES = [
  "ZohoMail.accounts.READ",
  "ZohoMail.folders.READ",
  "ZohoMail.messages.READ",
  "ZohoMail.messages.CREATE",
].join(",");

function env(name:string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + " is not configured in Vercel.");
  return value.replace(/\/$/, "");
}

export function zohoRedirectUri() {
  return env("ZOHO_REDIRECT_URI");
}

export async function startZohoOAuth() {
  const state = randomBytes(32).toString("hex");
  const params = new URLSearchParams({
    response_type:"code",
    client_id:env("ZOHO_CLIENT_ID"),
    scope:SCOPES,
    redirect_uri:zohoRedirectUri(),
    access_type:"offline",
    prompt:"consent",
    state,
  });
  const cookieStore = await cookies();
  cookieStore.set("zoho_oauth_state",state,{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
  return env("ZOHO_ACCOUNTS_URL") + "/oauth/v2/auth?" + params.toString();
}

async function tokenRequest(body:URLSearchParams) {
  const response = await fetch(env("ZOHO_ACCOUNTS_URL") + "/oauth/v2/token",{
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body,
    cache:"no-store",
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok || data.error) throw new Error(data.error || "Zoho OAuth token exchange failed.");
  return data;
}

export async function exchangeZohoCode(code:string) {
  return tokenRequest(new URLSearchParams({
    grant_type:"authorization_code",
    client_id:env("ZOHO_CLIENT_ID"),
    client_secret:env("ZOHO_CLIENT_SECRET"),
    redirect_uri:zohoRedirectUri(),
    code,
  }));
}

async function saveConnection(values:Record<string,unknown>) {
  const db=createAdminClient();
  const {error}=await db.from("petit_sot_zoho_connections").upsert({
    id:CONNECTION_ID,...values,updated_at:new Date().toISOString(),
  },{onConflict:"id"});
  if(error)throw error;
}

export async function storeZohoConnection(token:any) {
  if(!token.access_token || !token.refresh_token) throw new Error("Zoho did not return an offline refresh token. Reconnect and approve access.");
  const api=env("ZOHO_MAIL_API_URL");
  const accountsResponse=await fetch(api+"/api/accounts",{
    headers:{Authorization:"Zoho-oauthtoken "+token.access_token,Accept:"application/json"},
    cache:"no-store",
  });
  const accountsJson=await accountsResponse.json().catch(()=>({}));
  if(!accountsResponse.ok || Number(accountsJson?.status?.code)>=400) throw new Error(accountsJson?.status?.description || "Could not retrieve Zoho Mail accounts.");
  const accounts=accountsJson?.data || [];
  const account=accounts.find((item:any)=>String(item.primaryEmailAddress||"").toLowerCase()==="manager@petitsot.com") || accounts[0];
  if(!account?.accountId) throw new Error("Zoho authorized successfully, but no mail account was returned.");
  await saveConnection({
    account_id:String(account.accountId),
    account_email:account.primaryEmailAddress || account.emailAddress || null,
    access_token:token.access_token,
    refresh_token:token.refresh_token,
    expires_at:new Date(Date.now()+Number(token.expires_in||3600)*1000).toISOString(),
    scope:token.scope || SCOPES,
  });
}

export async function getZohoConnection() {
  const db=createAdminClient();
  const {data,error}=await db.from("petit_sot_zoho_connections")
    .select("account_id,account_email,expires_at,scope,updated_at")
    .eq("id",CONNECTION_ID).maybeSingle();
  if(error)throw error;
  return data;
}

async function getToken() {
  const db=createAdminClient();
  const {data:connection,error}=await db.from("petit_sot_zoho_connections")
    .select("*").eq("id",CONNECTION_ID).maybeSingle();
  if(error)throw error;
  if(!connection?.refresh_token || !connection?.account_id) throw new Error("Zoho Mail is not connected.");
  let accessToken=connection.access_token;
  const expiresAt=connection.expires_at?new Date(connection.expires_at).getTime():0;
  if(!accessToken || expiresAt-Date.now()<120000) {
    const token=await tokenRequest(new URLSearchParams({
      grant_type:"refresh_token",
      client_id:env("ZOHO_CLIENT_ID"),
      client_secret:env("ZOHO_CLIENT_SECRET"),
      refresh_token:connection.refresh_token,
    }));
    accessToken=token.access_token;
    await saveConnection({
      account_id:connection.account_id,
      account_email:connection.account_email,
      access_token:accessToken,
      refresh_token:connection.refresh_token,
      expires_at:new Date(Date.now()+Number(token.expires_in||3600)*1000).toISOString(),
      scope:connection.scope,
    });
  }
  return {accessToken,accountId:String(connection.account_id),accountEmail:connection.account_email as string|null};
}

export async function zohoRequest(path:string,init:RequestInit={}) {
  const {accessToken}=await getToken();
  const response=await fetch(env("ZOHO_MAIL_API_URL")+path,{
    ...init,
    headers:{
      Accept:"application/json",
      ...(init.body?{"content-type":"application/json"}:{}),
      ...Object.fromEntries(new Headers(init.headers).entries()),
      Authorization:"Zoho-oauthtoken "+accessToken,
    },
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok || (data?.status?.code && Number(data.status.code)>=400)) {
    throw new Error(data?.status?.description || data?.data?.moreInfo || "Zoho Mail API request failed ("+response.status+").");
  }
  return data;
}

export async function getZohoAccountContext() {
  const {accountId,accountEmail}=await getToken();
  return {accountId,accountEmail};
}
