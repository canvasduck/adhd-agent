import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

/**
 * Get the current user from the session.
 * Returns null if auth is disabled or user is not authenticated.
 */
export async function getUser() {
  if (!config.authEnabled) {
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication for an API route.
 * Returns the user if authenticated, or an error response if not.
 * Skips auth check if auth is disabled.
 */
export async function requireAuth(): Promise<
  | { user: Awaited<ReturnType<typeof getUser>>; error: null }
  | { user: null; error: Response }
> {
  if (!config.authEnabled) {
    return { user: null, error: null };
  }

  const user = await getUser();

  if (!user) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { user, error: null };
}

/**
 * Get the user ID for database queries.
 * Returns a placeholder ID if auth is disabled (for development).
 */
export async function getUserId(): Promise<string> {
  if (!config.authEnabled) {
    // Return a consistent placeholder ID for development
    return 'dev-user-id';
  }

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}
