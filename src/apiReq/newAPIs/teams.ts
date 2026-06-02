"use client";
import clientConnectionWithSupabase from "@/lib/supabase/client";

interface VotumTeam {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  created_at?: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  added_by: string;
  created_at?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const fetchAllTeamsOnWorkspace = async (
  workspace_id: any
): Promise<VotumTeam[] | null> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase
      .from("votum_teams")
      .select("*")
      .eq("workspace_id", workspace_id);

    if (error) {
      throw error;
    }

    return data as VotumTeam[];
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

export const fetchTeamMembers = async (
  teamId: string
): Promise<TeamMember[] | null> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase
      .from("votum_team_members")
      .select(
        `
        *,
        user:user_id (id, name, email)
      `
      )
      .eq("team_id", teamId);

    if (error) {
      throw error;
    }

    return data as TeamMember[];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return null;
  }
};

export const createTeam = async (
  name: string,
  workspace_id: string,
  description?: string
): Promise<VotumTeam | null> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase
      .from("votum_teams")
      .insert({
        name,
        description: description || null,
        workspace_id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as VotumTeam;
  } catch (error) {
    console.error("Error creating team:", error);
    return null;
  }
};

export const deleteTeam = async (teamId: string): Promise<boolean> => {
  try {
    const supabase = clientConnectionWithSupabase();

    // First delete all team members
    const { error: memberError } = await supabase
      .from("votum_team_members")
      .delete()
      .eq("team_id", teamId);

    if (memberError) {
      throw memberError;
    }

    // Then delete the team
    const { error } = await supabase
      .from("votum_teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting team:", error);
    return false;
  }
};

export const addTeamMembers = async (
  teamId: string,
  userIds: string[],
  addedBy: string
): Promise<TeamMember[] | null> => {
  try {
    const supabase = clientConnectionWithSupabase();

    const members = userIds.map((userId) => ({
      team_id: teamId,
      user_id: userId,
      added_by: addedBy,
    }));

    const { data, error } = await supabase
      .from("votum_team_members")
      .insert(members)
      .select();

    if (error) {
      throw error;
    }

    return data as TeamMember[];
  } catch (error) {
    console.error("Error adding team members:", error);
    return null;
  }
};

export const removeTeamMember = async (
  membershipId: string
): Promise<boolean> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { error } = await supabase
      .from("votum_team_members")
      .delete()
      .eq("id", membershipId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error removing team member:", error);
    return false;
  }
};

export const assignTeamToTask = async (
  teamId: string | null,
  taskid: any
): Promise<VotumTeam | null> => {
  try {
    const supabase = clientConnectionWithSupabase();

    const { data, error } = await supabase
      .from("votum_tasks")
      .update({ assigned_team: teamId })
      .eq("id", taskid)
      .select();

    if (error) {
      throw error;
    }

    return data ? (data[0] as VotumTeam) : null;
  } catch (error) {
    console.error("Error updating on tasks:", error);
    return null;
  }
};

export const getSelectedTeamFromTasks = async (
  taskid: any
): Promise<string | null> => {
  try {
    const supabase = clientConnectionWithSupabase();

    const { data, error } = await supabase
      .from("votum_tasks")
      .select("assigned_team")
      .eq("id", taskid);

    if (error) {
      throw error;
    }

    return data ? (data[0].assigned_team as string) : null;
  } catch (error) {
    console.error("Error updating on tasks:", error);
    return null;
  }
};

export const addNewTeamToWorkspace = async (
  teamName: string,
  workspace_id: any
) => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase
      .from("votum_teams")
      .insert([{ name: teamName, workspace_id: workspace_id }]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating new team:", error);
    return null;
  }
};
