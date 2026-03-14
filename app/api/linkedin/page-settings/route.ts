import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  decryptToken,
  encryptToken,
  ensureValidLinkedInPageToken,
  readLinkedInPages,
  refreshLinkedInAccessToken,
  upsertLinkedInPage,
  writeLinkedInPages,
} from "@/lib/linkedin";
import type { LinkedInPageTokenEntry, PageData } from "@/types/linkedin";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const normalizePageUrn = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("urn:li:organization:")) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    return `urn:li:organization:${trimmed}`;
  }
  if (trimmed.toLowerCase().startsWith("organization:")) {
    const id = trimmed.split(":")[1]?.trim();
    if (id && /^\d+$/.test(id)) {
      return `urn:li:organization:${id}`;
    }
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("linkedin.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const markers = ["company", "showcase", "organization"];
      const markerIndex = parts.findIndex((part) => markers.includes(part.toLowerCase()));
      if (markerIndex >= 0) {
        const candidate = parts[markerIndex + 1];
        if (candidate && /^\d+$/.test(candidate)) {
          return `urn:li:organization:${candidate}`;
        }
      }
    }
  } catch {
  }
  return null;
};

const getOrganizationId = (urn: string | null | undefined) => {
  if (!urn) return null;
  const match = urn.match(/organization:(\d+)/i);
  return match ? match[1] : null;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ configured: false }, { status: 200 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("linkedin_page_access_token_encrypted");

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const pageEntries = readLinkedInPages(
    user.linkedin_page_access_token_encrypted,
    null
  );
  const configured = pageEntries.length > 0;
  const defaultPageUrn = pageEntries[pageEntries.length - 1]?.pageUrn || null;
  let pageError = null as string | null;
  let pageWarning = null as string | null;
  let page = null as PageData | null;

  const buildFallbackPage = (entry: LinkedInPageTokenEntry): PageData => {
    const orgId = getOrganizationId(entry.pageUrn);
    return {
      id: orgId || entry.pageUrn,
      name: entry.name || null,
      description: null,
      vanityName: null,
      logoUrl: entry.logoUrl || null,
      urn: entry.pageUrn,
      metrics: null,
      isValid: false,
      canRefresh: !!entry.tokenLongEncrypted,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
    };
  };

  const fetchPageData = async (entry: LinkedInPageTokenEntry) => {
    let localError = null as string | null;
    let localWarning = null as string | null;
    let dataPage = buildFallbackPage(entry);

    try {
      const token = decryptToken(entry.tokenEncrypted);
      const orgId = getOrganizationId(entry.pageUrn);
      const orgUrn = orgId ? `urn:li:organization:${orgId}` : null;
      if (!token) {
        localError = "No se pudo descifrar el token de la página.";
        return { page: dataPage, pageError: localError, pageWarning: localWarning };
      }
      if (!orgId || !orgUrn) {
        localError = "No se pudo resolver el ID de la página.";
        return { page: dataPage, pageError: localError, pageWarning: localWarning };
      }

      const [orgResponse, followerResponse] = await Promise.all([
        fetch(
          `https://api.linkedin.com/v2/organizations/${orgId}?projection=(id,localizedName,vanityName,logoV2(original~:playableStreams,cropped~:playableStreams),staffCountRange)`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
            cache: "no-store",
          }
        ),
        fetch(
          `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
            cache: "no-store",
          }
        ),
      ]);

      if (!orgResponse.ok) {
        // Fallback: Try fetching without projection
        const responseFallback = await fetch(
          `https://api.linkedin.com/v2/organizations/${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
            cache: "no-store",
          }
        );

        if (responseFallback.ok) {
            const orgFallback = await responseFallback.json();
            // Reuse the same processing logic or simplified
             const logoUrlFallback =
                orgFallback.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier ||
                orgFallback.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier ||
                null;
            
            dataPage = {
                id: String(orgFallback.id),
                name: orgFallback.localizedName || null,
                description: orgFallback.localizedDescription || null,
                vanityName: orgFallback.vanityName || null,
                logoUrl: logoUrlFallback,
                urn: entry.pageUrn,
                metrics: {
                  followerCount: null,
                  followerDelta: null,
                  employeeCountRange: null
                },
                isValid: true,
                canRefresh: !!entry.tokenLongEncrypted,
                createdAt: entry.createdAt,
                expiresAt: entry.expiresAt,
            };
            return { page: dataPage, pageError: null, pageWarning: "Data loaded via fallback (limited metrics)." };
        }

        const errorPayload = await orgResponse.json().catch(() => null);
        const message =
          errorPayload?.message ||
          errorPayload?.error ||
          `LinkedIn respondió ${orgResponse.status}`;
        localError = `No se pudo obtener datos de la página. ${message}`;
        return { page: dataPage, pageError: localError, pageWarning: localWarning };
      }

      const org = await orgResponse.json();
      
      let logoUrl = null;
      if (org?.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
        logoUrl = org.logoV2["original~"].elements[0].identifiers[0].identifier;
      } else if (org?.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
        logoUrl = org.logoV2["cropped~"].elements[0].identifiers[0].identifier;
      }
      
      const staffStart = org?.staffCountRange?.start ?? null;
      const staffEnd = org?.staffCountRange?.end ?? null;
      const employeeCountRange =
        staffStart !== null && staffEnd !== null ? `${staffStart}-${staffEnd}` : null;

      let followerCount = null as number | null;
      let followerDelta = null as number | null;

      if (followerResponse.ok) {
        const followerJson = await followerResponse.json();
        const element = followerJson?.elements?.[0];
        const followerCounts = element?.followerCounts;
        const followerGains = element?.followerGains;
        followerCount =
          followerCounts?.organicFollowerCount ??
          followerCounts?.followerCount ??
          null;
        followerDelta =
          followerGains?.organicFollowerGain ??
          followerGains?.followerGain ??
          null;
        if (followerCount === null && followerDelta === null) {
          localWarning =
            "LinkedIn no devolvió métricas de seguidores para esta página.";
        }
      } else {
        const errorPayload = await followerResponse.json().catch(() => null);
        const message =
          errorPayload?.message ||
          errorPayload?.error ||
          `LinkedIn respondió ${followerResponse.status}`;
        localWarning = `No se pudo obtener métricas de seguidores. ${message}`;
      }

      dataPage = {
        id: String(org?.id ?? orgId),
        name: org?.localizedName ?? null,
        description: org?.localizedDescription ?? null,
        vanityName: org?.vanityName ?? null,
        logoUrl,
        urn: entry.pageUrn,
        metrics: {
          followerCount,
          followerDelta,
          employeeCountRange,
        },
        isValid: true,
        canRefresh: !!entry.tokenLongEncrypted,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt,
      };
    } catch {
      localError = "No se pudo cargar la información de la página.";
    }

    return { page: dataPage, pageError: localError, pageWarning: localWarning };
  };

  const pageResults = await Promise.all(pageEntries.map(fetchPageData));
  const pages = pageResults.map((result) => result.page);

  let hasUpdates = false;
  const updatedEntries = pageEntries.map((entry, index) => {
    const result = pageResults[index];
 
    const newName = result.page.name || undefined;
    const newLogo = result.page.logoUrl || undefined;
    
    if (
      result.page.isValid &&
      (entry.name !== newName || entry.logoUrl !== newLogo)
    ) {
      hasUpdates = true;
      return {
        ...entry,
        name: newName,
        logoUrl: newLogo,
      };
    }
    return entry;
  });

  if (hasUpdates) {
    const payload = writeLinkedInPages(updatedEntries);
    user.linkedin_page_access_token_encrypted = payload;
    await user.save();
  }

  if (defaultPageUrn) {
    const defaultResultIndex = pageEntries.findIndex(
      (entry) => entry.pageUrn === defaultPageUrn
    );
    const defaultResult =
      defaultResultIndex >= 0 ? pageResults[defaultResultIndex] : null;
    page = defaultResult?.page || pages[0] || null;
    pageError = defaultResult?.pageError || null;
    pageWarning = defaultResult?.pageWarning || null;
  }

  return NextResponse.json(
    {
      configured,
      pageUrn: defaultPageUrn,
      page,
      pages,
      pageError,
      pageWarning,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        token?: string;
        tokenLong?: string;
        page?: string;
        clientId?: string;
        clientSecret?: string;
      }
    | null;

  const token = body?.token?.trim() ?? "";
  const tokenLong = body?.tokenLong?.trim() ?? "";
  const page = body?.page?.trim() ?? "";
  const clientId = body?.clientId?.trim();
  const clientSecret = body?.clientSecret?.trim();

  if (!page || (!token && !tokenLong)) {
    return NextResponse.json(
      { error: "Debes ingresar la página y al menos un token" },
      { status: 400 }
    );
  }

  const pageUrn = normalizePageUrn(page);
  if (!pageUrn) {
    return NextResponse.json(
      { error: "El ID o URN de la página no es válido. Usa un ID numérico, URN o URL con ID." },
      { status: 400 }
    );
  }

  const orgId = getOrganizationId(pageUrn);
  if (!orgId) {
    return NextResponse.json(
      { error: "No se pudo resolver el ID de la página." },
      { status: 400 }
    );
  }

  const validateToken = async (accessToken: string) => {
    // Intenta obtener la información básica de la organización
    // Se usa proyección para asegurar que vengan los campos de logo
    const projection = "(id,localizedName,vanityName,logoV2(original~:playableStreams,cropped~:playableStreams))";
    const response = await fetch(
      `https://api.linkedin.com/v2/organizations/${orgId}?projection=${projection}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        cache: "no-store",
      }
    );

    if (response.ok) {
      const data = await response.json();
      const name = data.localizedName;
      
      // Intentar extraer el logo de varias formas posibles
      let logoUrl = null;
      
      // 1. Original
      if (data.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
        logoUrl = data.logoV2["original~"].elements[0].identifiers[0].identifier;
      } 
      // 2. Cropped (a veces es lo que hay disponible)
      else if (data.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
        logoUrl = data.logoV2["cropped~"].elements[0].identifiers[0].identifier;
      }

      console.log("LinkedIn Organization Data fetched:", { name, logoUrlFound: !!logoUrl });

      return { valid: true, name, logoUrl };
    }
    
    // Si falla con proyección, intentamos sin ella (fallback)
    const responseFallback = await fetch(
      `https://api.linkedin.com/v2/organizations/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        cache: "no-store",
      }
    );

    if (responseFallback.ok) {
        const data = await responseFallback.json();
        const name = data.localizedName;
        const logoUrl =
            data.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier ||
            data.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier ||
            null;
            
        console.log("LinkedIn Organization Data fetched (fallback):", { name, logoUrlFound: !!logoUrl });
        return { valid: true, name, logoUrl };
    }

    const errorPayload = await response.json().catch(() => null);
    const message =
      errorPayload?.message ||
      errorPayload?.error ||
      `Status ${response.status}`;
    console.error("LinkedIn Validate Token Error:", message);
    return { valid: false, message };
  };

  let finalAccessToken = "";
  let finalRefreshToken = tokenLong || null;
  let finalExpiresAt: number | undefined = undefined;
  const validationMessages: string[] = [];
  let pageName: string | undefined;
  let pageLogoUrl: string | null | undefined;

  let shortTokenSuccess = false;
  if (token) {
    const { valid, message, name, logoUrl } = await validateToken(token);
    if (valid) {
      finalAccessToken = token;
      shortTokenSuccess = true;
      pageName = name;
      pageLogoUrl = logoUrl;
    } else {
      validationMessages.push(`Token corto inválido: ${message}`);
    }
  }

  if (!shortTokenSuccess && tokenLong) {
    const { valid, message, name, logoUrl } = await validateToken(tokenLong);
    if (valid) {
      finalAccessToken = tokenLong;
      finalRefreshToken = null;
      shortTokenSuccess = true;
      pageName = name;
      pageLogoUrl = logoUrl;
    } else {
      validationMessages.push(`Token largo (directo) inválido: ${message}`);

      const refreshed = await refreshLinkedInAccessToken(tokenLong, {
        clientId,
        clientSecret,
      });

      if (refreshed.accessToken) {
        const {
          valid: validRefresh,
          message: messageRefresh,
          name: nameRefresh,
          logoUrl: logoUrlRefresh,
        } = await validateToken(refreshed.accessToken);
        if (validRefresh) {
          finalAccessToken = refreshed.accessToken;
          if (refreshed.refreshToken) {
            finalRefreshToken = refreshed.refreshToken;
          } else {
            finalRefreshToken = tokenLong;
          }
          shortTokenSuccess = true;
          pageName = nameRefresh;
          pageLogoUrl = logoUrlRefresh;
          if (refreshed.expiresIn) {
            finalExpiresAt = Date.now() + refreshed.expiresIn * 1000;
          }
        } else {
          validationMessages.push(`Refresh generado inválido: ${messageRefresh}`);
        }
      } else {
        validationMessages.push(`Refresh falló: ${refreshed.error}`);
      }
    }
  }

  if (!shortTokenSuccess) {
    return NextResponse.json(
      {
        error: `No se pudo validar ningún token. Detalles: ${validationMessages.join(
          " | "
        )}`,
      },
      { status: 400 }
    );
  }

  let encrypted = "";
  let encryptedLong = null as string | null;
  let encryptedClientId = undefined as string | undefined;
  let encryptedClientSecret = undefined as string | undefined;

  try {
    encrypted = encryptToken(finalAccessToken);
    if (finalRefreshToken) {
      encryptedLong = encryptToken(finalRefreshToken);
    }
    if (clientId) {
      encryptedClientId = encryptToken(clientId);
    }
    if (clientSecret) {
      encryptedClientSecret = encryptToken(clientSecret);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudo cifrar el token";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("linkedin_page_access_token_encrypted");

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const existingPages = readLinkedInPages(
    user.linkedin_page_access_token_encrypted,
    null
  );

  const previousEntry = existingPages.find((p) => p.pageUrn === pageUrn);

  const providedTokenLong = body?.tokenLong !== undefined;
  const providedClientId = body?.clientId !== undefined;
  const providedClientSecret = body?.clientSecret !== undefined;

  let finalEncryptedLong = encryptedLong;
  let finalEncryptedClientId = encryptedClientId;
  let finalEncryptedClientSecret = encryptedClientSecret;

  if (!providedTokenLong && previousEntry) {
    finalEncryptedLong = previousEntry.tokenLongEncrypted ?? null;
  }
  if (!providedClientId && previousEntry) {
    finalEncryptedClientId = previousEntry.clientIdEncrypted ?? undefined;
  }
  if (!providedClientSecret && previousEntry) {
    finalEncryptedClientSecret = previousEntry.clientSecretEncrypted ?? undefined;
  }

  const finalName = pageName || previousEntry?.name;
  const finalLogoUrl = pageLogoUrl || previousEntry?.logoUrl;

  const updatedPages = upsertLinkedInPage(existingPages, {
    pageUrn,
    tokenEncrypted: encrypted,
    tokenLongEncrypted: finalEncryptedLong,
    createdAt: new Date().toISOString(),
    expiresAt: finalExpiresAt,
    clientIdEncrypted: finalEncryptedClientId,
    clientSecretEncrypted: finalEncryptedClientSecret,
    name: finalName,
    logoUrl: finalLogoUrl,
  });
  const payload = writeLinkedInPages(updatedPages);

  user.linkedin_page_access_token_encrypted = payload;
  if (finalLogoUrl) {
    user.linkedin_page_image = finalLogoUrl;
  }
  await user.save();

  return NextResponse.json({ ok: true, pageUrn }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { pageUrn?: string } | null;

  if (!body?.pageUrn) {
    return NextResponse.json(
      { error: "El URN de la página es obligatorio" },
      { status: 400 }
    );
  }

  try {
    // ensureValidLinkedInPageToken now uses Mongoose internally
    await ensureValidLinkedInPageToken({
      userId: session.user.id,
      pageUrn: body.pageUrn,
      forceRefresh: true,
    });

    return NextResponse.json({ ok: true, pageUrn: body.pageUrn }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al renovar el token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { pageUrn?: string }
    | null;

  if (!body?.pageUrn) {
    return NextResponse.json(
      { error: "El URN de la página es obligatorio" },
      { status: 400 }
    );
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("linkedin_page_access_token_encrypted");

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const existingPages = readLinkedInPages(
    user.linkedin_page_access_token_encrypted,
    null
  );
  const updatedPages = existingPages.filter(
    (page) => page.pageUrn !== body.pageUrn
  );
  const payload = updatedPages.length > 0 ? writeLinkedInPages(updatedPages) : undefined;

  user.linkedin_page_access_token_encrypted = payload;
  await user.save();

  return NextResponse.json({ ok: true }, { status: 200 });
}
