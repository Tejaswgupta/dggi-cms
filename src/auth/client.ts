"use client";

import clientConnectionWithSupabase from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

export const signOut = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign out",
    };
  }
};

export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void,
) => {
  const supabase = clientConnectionWithSupabase();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
      });
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
};

export const resetPasswordForEmail = async (
  email: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send reset email",
    };
  }
};

export const updatePassword = async (
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true };
    }

    return { success: false, error: "Failed to update password" };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
};
