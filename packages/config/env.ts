export type Env = {
  NODE_ENV: string;
  PORT?: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  ELASTICSEARCH_NODE?: string;
  OAUTH_REDIRECT_BASE?: string;
  OAUTH_REDIRECT_ALLOWLIST?: string;
  OAUTH_COOKIE_SECRET?: string;
  OAUTH_STATE_TTL_SECONDS?: string;
  OAUTH_PKCE_ENABLED?: string;
  DRY_RUN?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  META_VERIFY_TOKEN?: string;
  LINKEDIN_CLIENT_ID?: string;
  LINKEDIN_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  YOUTUBE_CLIENT_ID?: string;
  YOUTUBE_CLIENT_SECRET?: string;
  LINKEDIN_WEBHOOK_SECRET?: string;
  GOOGLE_WEBHOOK_SECRET?: string;
  TOKEN_ENC_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  PERPLEXITY_BASE_URL?: string;
  PERPLEXITY_MODEL?: string;
};

export function loadEnv(): Env {
  const get = (k: string) => process.env[k];
  const required = (k: string) => {
    const v = get(k);
    if (!v) throw new Error(`Missing required env: ${k}`);
    return v;
  };

  const env: Env = {
    NODE_ENV: get('NODE_ENV') || 'development',
    PORT: get('PORT'),
    DATABASE_URL: required('DATABASE_URL'),
    REDIS_URL: required('REDIS_URL'),
    ELASTICSEARCH_NODE: get('ELASTICSEARCH_NODE'),
    OAUTH_REDIRECT_BASE: get('OAUTH_REDIRECT_BASE'),
    OAUTH_REDIRECT_ALLOWLIST: get('OAUTH_REDIRECT_ALLOWLIST'),
    OAUTH_COOKIE_SECRET: get('OAUTH_COOKIE_SECRET'),
    OAUTH_STATE_TTL_SECONDS: get('OAUTH_STATE_TTL_SECONDS') || '300',
    OAUTH_PKCE_ENABLED: get('OAUTH_PKCE_ENABLED') || 'true',
    DRY_RUN: get('DRY_RUN') || 'false',
    META_APP_ID: get('META_APP_ID'),
    META_APP_SECRET: get('META_APP_SECRET'),
    META_VERIFY_TOKEN: get('META_VERIFY_TOKEN'),
    LINKEDIN_CLIENT_ID: get('LINKEDIN_CLIENT_ID'),
    LINKEDIN_CLIENT_SECRET: get('LINKEDIN_CLIENT_SECRET'),
    GOOGLE_CLIENT_ID: get('GOOGLE_CLIENT_ID') || get('YOUTUBE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: get('GOOGLE_CLIENT_SECRET') || get('YOUTUBE_CLIENT_SECRET'),
    YOUTUBE_CLIENT_ID: get('YOUTUBE_CLIENT_ID'),
    YOUTUBE_CLIENT_SECRET: get('YOUTUBE_CLIENT_SECRET'),
    LINKEDIN_WEBHOOK_SECRET: get('LINKEDIN_WEBHOOK_SECRET'),
    GOOGLE_WEBHOOK_SECRET: get('GOOGLE_WEBHOOK_SECRET'),
    TOKEN_ENC_KEY: get('TOKEN_ENC_KEY'),
    PERPLEXITY_API_KEY: get('PERPLEXITY_API_KEY'),
    PERPLEXITY_BASE_URL: get('PERPLEXITY_BASE_URL') || 'https://api.perplexity.ai',
    PERPLEXITY_MODEL: get('PERPLEXITY_MODEL') || 'sonar-large-online',
  };

  return env;
}
