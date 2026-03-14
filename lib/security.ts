export interface ProxyConfig {
  allowedDomains: string[];
}

export const PROXY_CONFIG: ProxyConfig = {
  allowedDomains: ["licdn.com", "media.licdn.com", "dms.licdn.com"],
};
