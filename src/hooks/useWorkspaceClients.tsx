import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

export default function useWorkspaceClients() {
  const [clientOptions, setClientOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    const getClientsData = async () => {
      // Prevent multiple simultaneous calls
      if (isLoading || hasAttemptedRef.current) {
        return;
      }

      setIsLoading(true);
      hasAttemptedRef.current = true;

      try {
        const workspaceId = await getWorkspaceId();

        // If we don't have workspace id, we can't fetch clients
        if (!workspaceId) {
          console.warn("No workspace ID available for fetching clients");
          setClientOptions([]);
          return;
        }

        const supabase = clientConnectionWithSupabase();
        const { data, error } = await supabase
          .from("votum_clients")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Failed to fetch clients:", error.message);
          setClientOptions([]);
          return;
        }

        const clients = data ?? [];

        if (clients && Array.isArray(clients)) {
          setClientOptions(clients);
          if (clients.length === 0) {
            console.info("No clients found in workspace");
          }
        } else {
          console.warn("Failed to fetch clients or received invalid data");
          setClientOptions([]);
        }
      } catch (error) {
        console.error("Error fetching workspace clients:", error);
        setClientOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    getClientsData();
  }, []);

  return clientOptions;
}
