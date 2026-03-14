import { PROXY_CONFIG } from "@/lib/security";

export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return url; // Already local or relative
  if (PROXY_CONFIG.allowedDomains.some((domain) => url.includes(domain))) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
