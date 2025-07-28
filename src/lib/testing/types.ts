// Smoke Test Types

export type TestMetadataValue = string | number | boolean | null | string[] | unknown;
export type TestMetadata = Record<string, TestMetadataValue>;

export interface TestUser {
  id: string;
  email?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface TestSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: TestUser;
  [key: string]: unknown;
}

export interface TestPrompt {
  id: string;
  title: string;
  content: string;
  variables?: Record<string, string | number | boolean | null>;
  [key: string]: unknown;
}

export interface TestContext {
  id: string;
  name: string;
  content: string;
  variables?: Record<string, string | number | boolean | null>;
  [key: string]: unknown;
}

export interface TestSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  [key: string]: unknown;
}
