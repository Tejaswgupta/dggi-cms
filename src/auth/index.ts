"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import createSupabaseServerClient from "../lib/supabase/server";

interface WorkspaceData {
  id: string;
  name: string;
  email: string;
  accept_other_users?: boolean;
}

export interface SignupFormData {
  email: string;
  password: string;
  name: string;
  workspaceDetailForInvite?: WorkspaceData;
  Workspacename?: string;
  createWorkspace?: boolean;
}

interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const signupWithEmailPassword = async (
  formdata: SignupFormData
): Promise<AuthResponse> => {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formdata.email,
      password: formdata.password,
      options: {
        data: {
          name: formdata.name,
          workspace_id: formdata.workspaceDetailForInvite?.id,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Signup failed",
      };
    }

    if (formdata.createWorkspace) {
      const workspaceData = await handleWorkspace(supabase, formdata);
      if ("error" in workspaceData) {
        return workspaceData;
      }

      const userData = await createUserRecord(
        supabase,
        authData.user.id,
        formdata,
        workspaceData.workspace,
        workspaceData.role
      );

      return userData;
    } else {
      const userData = await createUserRecord(
        supabase,
        authData.user.id,
        formdata,
        formdata.workspaceDetailForInvite,
        "user"
      );
      return userData;
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

async function handleWorkspace(
  supabase: SupabaseClient,
  formdata: SignupFormData
): Promise<{
  workspace?: WorkspaceData;
  role?: string;
  success: boolean;
  error?: string;
}> {
  if (formdata.workspaceDetailForInvite) {
    return {
      success: true,
      workspace: formdata.workspaceDetailForInvite,
      role: "user",
    };
  }

  if (!formdata.Workspacename) {
    return {
      success: false,
      error: "Workspace name is required when creating a new workspace",
    };
  }

  const { data, error } = await supabase
    .from("votum_workspace")
    .insert([
      {
        name: formdata.Workspacename,
        email: formdata.email,
        accept_other_users: true,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, workspace: data, role: "owner" };
}

async function createUserRecord(
  supabase: SupabaseClient,
  userId: string,
  formdata: SignupFormData,
  workspaceData: WorkspaceData,
  role: string
): Promise<AuthResponse> {
  const { data: userData, error: userError } = await supabase
    .from("votum_users")
    .insert([
      {
        id: userId,
        email: formdata.email,
        name: formdata.name,
        workspace_id: workspaceData.id,
        role: role,
      },
    ])
    .select()
    .single();

  if (formdata.createWorkspace) {
    await supabase.auth.updateUser({
      data: {
        workspace_id: workspaceData.id,
      },
    });
  }

  if (userError) {
    return { success: false, error: userError.message };
  }

  return { success: true, data: userData };
}

interface SigninFormData {
  email: string;
  password: string;
}

export const signinWithEmailPassword = async (
  formdata: SigninFormData
): Promise<AuthResponse> => {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: formdata.email,
        password: formdata.password,
      });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Sign in failed",
      };
    }

    const { data: userData, error: userError } = await supabase
      .from("votum_users")
      .select("*")
      .eq("email", formdata.email)
      .single();

    if (userError) {
      return { success: false, error: userError.message };
    }

    return { success: true, data: userData };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
