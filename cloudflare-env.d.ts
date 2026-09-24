declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    MIDTRANS_SERVER_KEY?: string;
    MIDTRANS_IS_PRODUCTION?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_EMAIL_TOKEN?: string;
    RESET_FROM_EMAIL?: string;
    RESET_EMAIL_DEV_MODE?: string;
    COMMERCE_CLEANUP_TOKEN?: string;
  }
}
