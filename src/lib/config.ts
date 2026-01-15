/**
 * Application configuration
 *
 * AUTH_ENABLED flag controls whether authentication is required.
 * When false, the app works without login (useful for development).
 * When true, users must authenticate to access protected routes.
 */
export const config = {
  authEnabled: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
} as const;
