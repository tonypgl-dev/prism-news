const DEFAULT_VERSION = "v21.0";

export interface FacebookPostResult {
  id: string;
  post_id?: string;
}

export async function publishPagePost(params: {
  message: string;
  link?: string | null;
  imageUrl?: string | null;
}): Promise<FacebookPostResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  const version = process.env.FACEBOOK_GRAPH_VERSION?.trim() || DEFAULT_VERSION;

  if (!pageId || !token) {
    throw new Error("FACEBOOK_PAGE_ID sau FACEBOOK_PAGE_ACCESS_TOKEN lipsesc.");
  }

  const base = `https://graph.facebook.com/${version}/${pageId}`;

  if (params.imageUrl) {
    const caption =
      params.link && !params.message.includes(params.link)
        ? `${params.message}\n\n${params.link}`
        : params.message;
    const body = new URLSearchParams();
    body.set("url", params.imageUrl);
    body.set("caption", caption);
    body.set("access_token", token);

    const res = await fetch(`${base}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { id?: string; error?: { message: string } };
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Facebook photos error ${res.status}`);
    }
    return { id: json.id ?? "" };
  }

  const body = new URLSearchParams();
  body.set("message", params.message);
  body.set("access_token", token);
  if (params.link) body.set("link", params.link);

  const res = await fetch(`${base}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Facebook feed error ${res.status}`);
  }
  return { id: json.id ?? "" };
}
