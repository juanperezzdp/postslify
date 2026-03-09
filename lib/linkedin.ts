import crypto from "crypto";
import type { LinkedInPagesStore, LinkedInPageTokenEntry } from "@/types/linkedin";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const encryptToken = (value: string) => {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY no está configurado");
  }
  const key = crypto.createHash("sha256").update(rawKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
};

export const decryptToken = (payload: string) => {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY no está configurado");
  }
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Token cifrado inválido");
  }
  const [ivBase64, tagBase64, dataBase64] = parts;
  const key = crypto.createHash("sha256").update(rawKey).digest();
  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const data = Buffer.from(dataBase64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
};

export class LinkedInApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const refreshLinkedInAccessToken = async (
  refreshToken: string,
  credentials?: { clientId?: string; clientSecret?: string }
): Promise<{
  accessToken?: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  error?: string;
}> => {
  const clientId = credentials?.clientId || process.env.LINKEDIN_CLIENT_ID;
  const clientSecret =
    credentials?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      error: "Falta configurar Client ID o Client Secret (env o parámetros)",
    };
  }

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error_description || errorData?.error || response.statusText;
    return { error: `LinkedIn Refresh Error: ${message}` };
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
  };
  if (!data.access_token) {
    return { error: "LinkedIn no devolvió access_token" };
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 0,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
};

export async function publishToLinkedIn(
  accessToken: string,
  memberUrn: string,
  content: string,
  visibility: string = "PUBLIC",
  media?:
    | {
        buffer: Buffer;
        type: string;
        name?: string;
      }
    | Array<{
        buffer: Buffer;
        type: string;
        name?: string;
      }>
) {
  const getMediaKind = (type: string) => {
    const normalized = (type || "").toLowerCase();
    if (normalized === "image" || normalized.startsWith("image/")) return "image";
    if (normalized === "video" || normalized.startsWith("video/")) return "video";
    if (normalized === "document") return "document";
    if (
      normalized === "application/pdf" ||
      normalized === "application/msword" ||
      normalized === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "document";
    }
    return null;
  };

  const getRecipe = (kind: "image" | "video" | "document") => {
    if (kind === "image") return "urn:li:digitalmediaRecipe:feedshare-image";
    if (kind === "video") return "urn:li:digitalmediaRecipe:feedshare-video";
    return "urn:li:digitalmediaRecipe:feedshare-document";
  };

  const uploadToLinkedIn = async (item: { buffer: Buffer; type: string }) => {
    const kind = getMediaKind(item.type);
    if (!kind) return null;

    const recipe = getRecipe(kind);

    const registerResponse = await fetch(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [recipe],
            owner: memberUrn,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        }),
      }
    );

    if (!registerResponse.ok) {
      const err = await registerResponse.json().catch(() => null);
      const message = err?.message || "Error al iniciar la subida del archivo a LinkedIn";
      throw new LinkedInApiError(message, registerResponse.status);
    }

    const registerData = await registerResponse.json();
    const uploadUrl =
      registerData.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
    const assetUrn = registerData.value.asset as string;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(item.buffer),
    });

    if (!uploadResponse.ok) {
      console.error("LinkedIn File Upload Error status:", uploadResponse.status);
      throw new Error("Error al subir el archivo a LinkedIn");
    }

    return { assetUrn, kind };
  };

  let shareMediaCategory = "NONE";

  const mediaItems = Array.isArray(media) ? media : media ? [media] : [];
  const uploadedAssets: Array<{ assetUrn: string; name?: string }> = [];

  if (mediaItems.length > 0) {
    const firstKind = getMediaKind(mediaItems[0].type);
    if (firstKind === "image") {
      shareMediaCategory = "IMAGE";
      for (const item of mediaItems.slice(0, 9)) {
        const uploaded = await uploadToLinkedIn(item);
        if (!uploaded) continue;
        uploadedAssets.push({ assetUrn: uploaded.assetUrn, name: item.name });
      }
    } else if (firstKind === "video") {
      shareMediaCategory = "VIDEO";
      const uploaded = await uploadToLinkedIn(mediaItems[0]);
      if (uploaded) uploadedAssets.push({ assetUrn: uploaded.assetUrn, name: mediaItems[0].name });
    } else if (firstKind === "document") {
      shareMediaCategory = "NATIVE_DOCUMENT";
      const uploaded = await uploadToLinkedIn(mediaItems[0]);
      if (uploaded) uploadedAssets.push({ assetUrn: uploaded.assetUrn, name: mediaItems[0].name });
    }
  }

  const specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: string;
      media?: Array<{
        status: "READY";
        description: { text: string };
        media: string;
        title: { text: string };
      }>;
    };
  } = {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: content,
      },
      shareMediaCategory: shareMediaCategory,
    },
  };

  if (uploadedAssets.length > 0 && shareMediaCategory !== "NONE") {
    specificContent["com.linkedin.ugc.ShareContent"].media = uploadedAssets.map((asset, index) => ({
      status: "READY",
      description: {
        text: "Uploaded via Postslify",
      },
      media: asset.assetUrn,
      title: {
        text: asset.name || `Post Attachment ${index + 1}`,
      },
    }));
  }

  const payload = {
    author: memberUrn,
    lifecycleState: "PUBLISHED",
    specificContent,
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": visibility,
    },
  };

  const linkedinResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });

  if (!linkedinResponse.ok) {
    const errorData = await linkedinResponse.json().catch(() => null);
    const message = errorData?.message || "Error al publicar en LinkedIn";
    throw new LinkedInApiError(message, linkedinResponse.status);
  }

  return await linkedinResponse.json();
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPageEntry = (value: unknown): value is LinkedInPageTokenEntry => {
  if (!isRecord(value)) return false;
  const tokenLongEncrypted = value.tokenLongEncrypted;
  const tokenLongValid =
    tokenLongEncrypted === undefined ||
    tokenLongEncrypted === null ||
    typeof tokenLongEncrypted === "string";
  const expiresAt = value.expiresAt;
  const expiresAtValid =
    expiresAt === undefined ||
    expiresAt === null ||
    typeof expiresAt === "number";
  const clientIdEncrypted = value.clientIdEncrypted;
  const clientIdValid =
    clientIdEncrypted === undefined ||
    clientIdEncrypted === null ||
    typeof clientIdEncrypted === "string";
  const clientSecretEncrypted = value.clientSecretEncrypted;
  const clientSecretValid =
    clientSecretEncrypted === undefined ||
    clientSecretEncrypted === null ||
    typeof clientSecretEncrypted === "string";

  return (
    typeof value.pageUrn === "string" &&
    typeof value.tokenEncrypted === "string" &&
    typeof value.createdAt === "string" &&
    tokenLongValid &&
    expiresAtValid &&
    clientIdValid &&
    clientSecretValid
  );
};

const isPagesStore = (value: unknown): value is LinkedInPagesStore => {
  if (!isRecord(value)) return false;
  const pages = value.pages;
  return Array.isArray(pages) && pages.every(isPageEntry);
};

export const readLinkedInPages = (
  payload: string | null | undefined,
  pageUrn: string | null | undefined,
): LinkedInPageTokenEntry[] => {
  if (!payload) return [];
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (isPagesStore(parsed)) {
      return parsed.pages;
    }
  } catch {
  }
  if (!pageUrn) return [];
  return [
    {
      pageUrn,
      tokenEncrypted: payload,
      createdAt: new Date(0).toISOString(),
    },
  ];
};

export const findLinkedInPageEntry = ({
  encryptedPayload,
  defaultPageUrn,
  requestedPageUrn,
}: {
  encryptedPayload: string | null | undefined;
  defaultPageUrn?: string | null;
  requestedPageUrn?: string | null;
}): { entry: LinkedInPageTokenEntry | null; pageUrn: string | null } => {
  const pages = readLinkedInPages(encryptedPayload, defaultPageUrn ?? null);
  const targetUrn = requestedPageUrn || defaultPageUrn || pages[0]?.pageUrn || null;
  const entry = pages.find((page) => page.pageUrn === targetUrn) || pages[0] || null;
  return { entry, pageUrn: entry?.pageUrn ?? targetUrn };
};

export const writeLinkedInPages = (pages: LinkedInPageTokenEntry[]) =>
  JSON.stringify({ pages });

export const upsertLinkedInPage = (
  pages: LinkedInPageTokenEntry[],
  entry: LinkedInPageTokenEntry,
): LinkedInPageTokenEntry[] => {
  const without = pages.filter((page) => page.pageUrn !== entry.pageUrn);
  return [...without, entry];
};

export const resolveLinkedInPageAccess = ({
  encryptedPayload,
  defaultPageUrn,
  requestedPageUrn,
}: {
  encryptedPayload: string | null | undefined;
  defaultPageUrn?: string | null;
  requestedPageUrn?: string | null;
}): { accessToken: string | null; pageUrn: string | null } => {
  const { entry, pageUrn } = findLinkedInPageEntry({
    encryptedPayload,
    defaultPageUrn,
    requestedPageUrn,
  });
  if (!entry) {
    return { accessToken: null, pageUrn };
  }
  try {
    const accessToken = decryptToken(entry.tokenEncrypted);
    return { accessToken, pageUrn };
  } catch {
    return { accessToken: null, pageUrn };
  }
};

export const ensureValidLinkedInPageToken = async ({
  userId,
  pageUrn,
  forceRefresh = false,
}: {
  userId: string;
  pageUrn?: string | null;
  forceRefresh?: boolean;
}): Promise<{ accessToken: string; pageUrn: string }> => {
  await dbConnect();
  const user = await User.findById(userId).select("linkedin_page_access_token_encrypted");

  const encryptedPayload = user?.linkedin_page_access_token_encrypted;
  if (!encryptedPayload) {
    throw new Error("No hay página configurada");
  }

  const { entry, pageUrn: foundUrn } = findLinkedInPageEntry({
    encryptedPayload,
    requestedPageUrn: pageUrn,
  });

  if (!entry || !foundUrn) {
    throw new Error("Página no encontrada en la configuración");
  }

  const now = Date.now();
  const isExpired = entry.expiresAt && entry.expiresAt < now + 10 * 60 * 1000;
  
  if (!forceRefresh && !isExpired) {
    try {
      const token = decryptToken(entry.tokenEncrypted);
      return { accessToken: token, pageUrn: foundUrn };
    } catch {
      console.warn("Token decryption failed, attempting refresh");
    }
  }

  if (!entry.tokenLongEncrypted) {
    if (!forceRefresh && !isExpired) {
       throw new Error("Token corrupto y no hay token de refresco disponible");
    }
    throw new Error("El token expiró y no hay token de refresco disponible");
  }

  let tokenLong: string;
  try {
    tokenLong = decryptToken(entry.tokenLongEncrypted);
  } catch (error) {
    console.error("Error decrypting refresh token:", error);
    throw new Error("No se pudo descifrar el token de refresco");
  }

  let clientId: string | undefined;
  let clientSecret: string | undefined;

  try {
    if (entry.clientIdEncrypted) {
      clientId = decryptToken(entry.clientIdEncrypted);
    }
    if (entry.clientSecretEncrypted) {
      clientSecret = decryptToken(entry.clientSecretEncrypted);
    }
  } catch {
    console.error("Failed to decrypt client credentials");
  }

  const refreshed = await refreshLinkedInAccessToken(tokenLong, {
    clientId,
    clientSecret,
  });
  if (!refreshed.accessToken) {
    throw new LinkedInApiError(
      refreshed.error || "Falló el refresh del token",
      401
    );
  }

  const newEncrypted = encryptToken(refreshed.accessToken);
  const newExpiresAt = refreshed.expiresIn
    ? Date.now() + refreshed.expiresIn * 1000
    : undefined;

  let newTokenLongEncrypted = entry.tokenLongEncrypted;
  if (refreshed.refreshToken) {
    try {
      newTokenLongEncrypted = encryptToken(refreshed.refreshToken);
    } catch {
      console.error("Failed to encrypt new refresh token");
    }
  }

  const existingPages = readLinkedInPages(encryptedPayload, null);
  const updatedPages = upsertLinkedInPage(existingPages, {
    ...entry,
    tokenEncrypted: newEncrypted,
    tokenLongEncrypted: newTokenLongEncrypted,
    expiresAt: newExpiresAt,
    createdAt: new Date().toISOString(),
  });

  const payload = writeLinkedInPages(updatedPages);

  await User.findByIdAndUpdate(userId, {
    linkedin_page_access_token_encrypted: payload,
  });

  return { accessToken: refreshed.accessToken, pageUrn: foundUrn };
};
