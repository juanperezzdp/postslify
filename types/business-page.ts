export type BusinessPageFormValues = {
  token: string;
  tokenLong: string;
  page: string;
  clientId: string;
  clientSecret: string;
};

export type BusinessPageSaveResponse = {
  ok?: boolean;
  pageUrn?: string | null;
  error?: string;
};
