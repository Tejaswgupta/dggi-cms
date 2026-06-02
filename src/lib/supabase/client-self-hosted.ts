"use client";
import { createClient } from '@supabase/supabase-js';

export default function clientConnectionWithSelfHostedSupabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SELF_HOSTED_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SELF_HOSTED_SUPABASE_ANON_KEY!
  );

  return supabase;
}
