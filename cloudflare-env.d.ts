declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_EMAIL_TOKEN?: string;
    RESET_FROM_EMAIL?: string;
    RESET_EMAIL_DEV_MODE?: string;
  }
}
