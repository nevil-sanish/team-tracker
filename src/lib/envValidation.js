/**
 * Startup validation for required environment variables.
 * Crashes the app immediately if any are missing, preventing
 * silent failures in production.
 */

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    const message = `⛔ Missing required environment variables:\n${missing.map(k => `  • ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.`;

    // In development, show a clear error overlay
    if (import.meta.env.DEV) {
      console.error(message);
    }

    // Throw to halt the application
    throw new Error(message);
  }
}
