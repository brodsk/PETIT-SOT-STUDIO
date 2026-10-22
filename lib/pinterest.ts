import { randomBytes } from "crypto";

const PINTEREST_OAUTH = "https://www.pinterest.com/oauth/";
export function pinterestApiMode(): "sandbox" | "production" {
  return process.env.PINTEREST_API_MODE?.trim().toLowerCase() === "sandbox" ? "sandbox" : "production";
}
function pinterestApiBase() {
  return pinterestApiMode() === "sandbox" ? "https://api-sandbox.pinterest.com/v5" : "https://api.pinterest.com/v5";
}
function pinterestTokenUrl() {
  return pinterestApiBase() + "/oauth/token";
}

const BOARD_NAMES = ["Original Oil Paintings by Olga Trikhleb"];

function appConfig() {
  const clientId = process.env.PINTEREST_APP_ID?.trim();
  const clientSecret = process.env.PINTEREST_APP_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Pinterest API не настроен: добавьте PINTEREST_APP_ID и PINTEREST_APP_SECRET в переменные окружения Vercel.");
  }
  return { clientId, clientSecret };
}

export function pinterestRedirectUri() {
  return process.env.PINTEREST_REDIRECT_URI?.trim() ||
    "https://petitsot.com/api/admin/pinterest/callback";
}

export function startPinterestOAuth() {
  const { clientId } = appConfig();
  const state = randomBytes(32).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: pinterestRedirectUri(),
    response_type: "code",
    scope: "boards:read,boards:write,pins:read,pins:write,user_accounts:read",
    state,
  });
  return { url: PINTEREST_OAUTH + "?" + params.toString(), state };
}

export async function exchangePinterestCode(code: string) {
  const { clientId, clientSecret } = appConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: pinterestRedirectUri(),
  });
  const response = await fetch(pinterestTokenUrl(), {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error_description || data.error || "Pinterest не выдал токен доступа.");
  }
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Pinterest вернул неполный ответ OAuth: нет access_token или refresh_token.");
  }
  return data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_token_expires_in?: number;
    scope?: string;
    response_type?: string;
  };
}

export async function getPinterestConnection(supabase: any) {
  const { data, error } = await supabase
    .from("petit_sot_pinterest_connections")
    .select("id,pinterest_user_id,access_token,refresh_token,expires_at,refresh_token_expires_at,scope,board_ids,updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function pinterestApi(supabase: any, path: string, init: RequestInit = {}) {
  const { clientId, clientSecret } = appConfig();
  const connection = await getPinterestConnection(supabase);
  if (!connection?.access_token || !connection?.refresh_token) {
    throw new Error("Pinterest ещё не подключён. Откройте раздел Pinterest в админке и подключите аккаунт.");
  }

  let accessToken = connection.access_token;
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  if (!expiresAt || expiresAt - Date.now() < 5 * 60 * 1000) {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    });
    const refreshed = await fetch(pinterestTokenUrl(), {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
    const tokenData = await refreshed.json().catch(() => ({}));
    if (!refreshed.ok || !tokenData.access_token) {
      throw new Error(tokenData.message || tokenData.error_description || tokenData.error || "Не удалось обновить токен Pinterest. Переподключите аккаунт.");
    }
    accessToken = tokenData.access_token;
    const update: Record<string, any> = {
      access_token: accessToken,
      refresh_token: tokenData.refresh_token || connection.refresh_token,
      expires_at: new Date(Date.now() + Number(tokenData.expires_in || 2592000) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (tokenData.refresh_token_expires_in) {
      update.refresh_token_expires_at = new Date(Date.now() + Number(tokenData.refresh_token_expires_in) * 1000).toISOString();
    }
    const { error: updateError } = await supabase
      .from("petit_sot_pinterest_connections")
      .update(update)
      .eq("id", 1);
    if (updateError) throw updateError;
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + accessToken);
  if (init.body && !headers.has("content-type")) headers.set("Content-Type", "application/json");
  return fetch(pinterestApiBase() + path, { ...init, headers, cache: "no-store" });
}

async function readJson(response: Response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { message: raw.slice(0, 1000) };
  }
}

export async function ensurePinterestBoards(supabase: any) {
  const connection = await getPinterestConnection(supabase);
  if (!connection) throw new Error("Pinterest ещё не подключён.");
  const stored = (pinterestApiMode() === "sandbox" ? {} : connection.board_ids || {}) as Record<string, string>;
  if (BOARD_NAMES.every((name) => Boolean(stored[name]))) {
    return BOARD_NAMES.map((name) => ({ name, id: stored[name] }));
  }

  const listResponse = await pinterestApi(supabase, "/boards?page_size=100");
  const listData = await readJson(listResponse);
  if (!listResponse.ok) throw new Error(listData.message || "Не удалось получить доски Pinterest.");
  const items: any[] = Array.isArray(listData.items) ? listData.items : [];
  const boardIds: Record<string, string> = { ...stored };
  const boardList: { name: string; id: string }[] = [];

  for (const name of BOARD_NAMES) {
    let board = items.find((item) => String(item.name || "").trim().toLowerCase() === name.toLowerCase());
    if (!board?.id && boardIds[name]) board = { id: boardIds[name], name };
    if (!board?.id) {
      const createResponse = await pinterestApi(supabase, "/boards", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: "Original paintings and contemporary art by Olga Trikhleb, curated by PETITSOT.",
          privacy: "PUBLIC",
        }),
      });
      const created = await readJson(createResponse);
      if (!createResponse.ok || !created.id) {
        throw new Error(created.message || "Не удалось создать доску Pinterest: " + name);
      }
      board = created;
      items.push(created);
    }
    boardIds[name] = String(board.id);
    boardList.push({ name, id: String(board.id) });
  }

  const { error } = await supabase
    .from("petit_sot_pinterest_connections")
    .update({ board_ids: boardIds, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
  return boardList;
}

function chooseBoard(_artwork: any, boards: { name: string; id: string }[]) {
  return boards[0]?.id;
}

export async function publishArtworkPin(supabase: any, artworkId: string) {
  if (pinterestApiMode() !== "sandbox" && process.env.PINTEREST_ACCESS_LEVEL?.trim().toLowerCase() !== "standard") {
    throw new Error("Pinterest работает в режиме Trial. Для демонстрации включите PINTEREST_API_MODE=sandbox в Vercel, затем переподключите Pinterest. Реальные публикации в production требуют Standard access.");
  }
  const { data: artwork, error: artworkError } = await supabase
    .from("petit_sot_artworks")
    .select("id,slug,title,title_en,year,medium,description,description_en,ai_description,status,image_path")
    .eq("id", artworkId)
    .single();
  if (artworkError || !artwork) throw new Error("Картина не найдена.");
  if (artwork.status !== "available") throw new Error("В Pinterest публикуются только картины со статусом «В продаже».");
  if (!artwork.image_path) throw new Error("У картины нет главного изображения.");

  const { data: existing, error: existingError } = await supabase
    .from("petit_sot_pinterest_pins")
    .select("pinterest_pin_id,pin_url,state")
    .eq("artwork_id", artwork.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.state === "published" && existing.pinterest_pin_id) {
    return { status: "skipped", pinId: existing.pinterest_pin_id, pinUrl: existing.pin_url };
  }

  const { error: pendingError } = await supabase.from("petit_sot_pinterest_pins").upsert({
    artwork_id: artwork.id,
    state: "pending",
    error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "artwork_id" });
  if (pendingError) throw pendingError;

  try {
    const boards = await ensurePinterestBoards(supabase);
    const boardId = chooseBoard(artwork, boards);
    if (!boardId) throw new Error("Не найдена доска Pinterest для картины.");
    const imageUrl = supabase.storage.from("petit-sot-artworks").getPublicUrl(artwork.image_path).data.publicUrl;
    const title = String(artwork.title_en || artwork.title || "Original painting by Olga Trikhleb").slice(0, 100);
    const baseDescription = String(artwork.description_en || artwork.ai_description || artwork.description || "");
    const description = (baseDescription + "\n\nOriginal artwork by Olga Trikhleb. Discover the painting and purchase details at PETITSOT.").slice(0, 800);
    const link = "https://petitsot.com/works/" + encodeURIComponent(String(artwork.slug));

    const response = await pinterestApi(supabase, "/pins", {
      method: "POST",
      body: JSON.stringify({
        board_id: boardId,
        title,
        description,
        link,
        alt_text: title + " — original painting by Olga Trikhleb",
        media_source: { source_type: "image_url", url: imageUrl },
      }),
    });
    const data = await readJson(response);
    if (!response.ok || !data.id) {
      throw new Error(data.message || data.error || "Pinterest не смог создать пин.");
    }

    const pinUrl = "https://www.pinterest.com/pin/" + data.id + "/";
    const { error: saveError } = await supabase.from("petit_sot_pinterest_pins").upsert({
      artwork_id: artwork.id,
      pinterest_pin_id: String(data.id),
      board_id: boardId,
      pin_url: pinUrl,
      state: "published",
      error: null,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "artwork_id" });
    if (saveError) throw saveError;
    return { status: "published", pinId: String(data.id), pinUrl };
  } catch (error: any) {
    await supabase.from("petit_sot_pinterest_pins").upsert({
      artwork_id: artwork.id,
      state: "error",
      error: String(error?.message || "Ошибка Pinterest").slice(0, 1000),
      updated_at: new Date().toISOString(),
    }, { onConflict: "artwork_id" });
    throw error;
  }
}

export { BOARD_NAMES };
