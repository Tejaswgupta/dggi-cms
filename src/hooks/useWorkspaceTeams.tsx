import { fetchAllTeamsOnWorkspace } from "@/apiReq/newAPIs/teams";
import { getWorkspaceId } from "@/lib/action/workspace";
import { useEffect, useState } from "react";

export default function useWorkspaceTeams() {
  const [teamOptions, setTeamOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const getTeamsData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoading || hasAttempted) {
      return;
    }

    setIsLoading(true);
    setHasAttempted(true);

    try {
      const workspaceId = await getWorkspaceId();

      // If we don't have workspace id, we can't fetch teams
      if (!workspaceId) {
        console.warn("No workspace ID available for fetching teams");
        setTeamOptions([]);
        return;
      }

      const teams = await fetchAllTeamsOnWorkspace(workspaceId);
      if (teams && Array.isArray(teams)) {
        setTeamOptions(teams);
        if (teams.length === 0) {
          console.info("No teams found in workspace");
        }
      } else {
        console.warn("Failed to fetch teams or received invalid data");
        setTeamOptions([]);
      }
    } catch (error) {
      console.error("Error fetching workspace teams:", error);
      setTeamOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTeamsData();
  }, []);

  return teamOptions;
}
