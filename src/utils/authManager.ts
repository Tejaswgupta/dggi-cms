// utils/authManager.ts
import clientConnectionWithSupabase from "@/lib/supabase/client";

export const initializeAuthListener = () => {
  const supabase = clientConnectionWithSupabase();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      window.localStorage.clear();
    }
  });

  // Cleanup function
  return () => {
    subscription?.unsubscribe();
  };
};
