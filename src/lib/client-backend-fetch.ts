"use client";

import clientConnectionWithSupabase from "@/lib/supabase/client";

export async function getClientAccessToken(): Promise<string | null> {
  try {
    const supabase = clientConnectionWithSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch for client-side service functions that call the Python
 * backend directly (not via a Next.js API route proxy).
 * Injects the current user's Supabase Bearer token.
 */
export async function clientBackendFetch(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getClientAccessToken();
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
