// supabase/tests/testSafety.mjs
// Test safety helper: guards against writing to non-local Supabase environments.

const LOCAL_DEMO_URL = 'http://127.0.0.1:54321';
const LOCAL_DEMO_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const LOCAL_DEMO_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export function assertLocalSupabaseUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal) {
      throw new Error('Refusing to run write tests against a non-local database');
    }
  } catch (err) {
    if (err.message === 'Refusing to run write tests against a non-local database') {
      throw err;
    }
    throw new Error('Refusing to run write tests against a non-local database');
  }
}

export function getTestCredentials() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || LOCAL_DEMO_URL;
  assertLocalSupabaseUrl(url);

  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || LOCAL_DEMO_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_DEMO_SERVICE_ROLE_KEY;
  const functionsUrl = process.env.FUNCTIONS_URL || `${url}/functions/v1`;

  return {
    apiUrl: url,
    supabaseUrl: url,
    functionsUrl,
    anonKey,
    serviceRoleKey,
  };
}
