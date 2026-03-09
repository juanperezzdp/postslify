export type LinkedInUser = {
  name?: string;
  picture?: string;
  email?: string;
  headline?: string;
  memberUrn?: string;
  expiresAt?: number;
};

export type LinkedInSession = {
  accessToken: string;
  expiresAt: number;
  memberUrn: string;
  name?: string;
  picture?: string;
  email?: string;
  headline?: string;
};

export type PageMetrics = {
  followerCount: number | null;
  followerDelta: number | null;
  employeeCountRange: string | null;
};

export type PageData = {
  id: string;
  name: string | null;
  description: string | null;
  vanityName: string | null;
  logoUrl: string | null;
  urn: string;
  metrics: PageMetrics | null;
  isValid?: boolean;
  canRefresh?: boolean;
  createdAt?: string;
  expiresAt?: number;
};

export type LinkedInPageTokenEntry = {
  pageUrn: string;
  tokenEncrypted: string;
  tokenLongEncrypted?: string | null;
  createdAt: string;
  expiresAt?: number;
  clientIdEncrypted?: string;
  clientSecretEncrypted?: string;
  name?: string;
  logoUrl?: string | null;
};

export type LinkedInPagesStore = {
  pages: LinkedInPageTokenEntry[];
};

export type DraggablePosition = {
  x: number;
  y: number;
};

export type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export type PageSettingsResponse = {
  configured: boolean;
  pageUrn: string | null;
  page: PageData | null;
  pages?: PageData[];
  pageError: string | null;
  pageWarning?: string | null;
  error?: string;
};
