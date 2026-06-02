"use client";

import {
  assignTeamToTask,
  fetchAllTeamsOnWorkspace,
  getSelectedTeamFromTasks,
} from "@/apiReq/newAPIs/teams";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
interface VotumTeam {
  id: string;
  name: string;
  workspace_id: string;
}

export default function AssignTeamInTask({
  workspace_id,
  taskId,
}: {
  workspace_id: string;
  taskId: any;
}) {
  const [teams, setTeams] = useState<VotumTeam[] | null>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<VotumTeam | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string | null>(null);
  useEffect(() => {
    const getAllTeamForWID = async () => {
      if (!workspace_id) {
        console.warn("No workspace_id provided to AssignTeamInTask");
        return;
      }
      const teams: VotumTeam[] = await fetchAllTeamsOnWorkspace(workspace_id);
      setTeams(teams);
    };
    getAllTeamForWID();
  }, [workspace_id]);

  useEffect(() => {
    const getSelectedTeam = async () => {
      const assigned_team_id: string | null =
        await getSelectedTeamFromTasks(taskId);
      const selectedTeam =
        teams?.find((team) => team.id === assigned_team_id) || null;
      setSelectedTeam(selectedTeam);
    };
    getSelectedTeam();
  }, [teams]);

  const handleSelectTeam = async (team: VotumTeam | null) => {
    setSelectedTeam(team);
    await assignTeamToTask(team ? team.id : null, taskId);
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={popoverOpen}
          className="base:w-[65%] tv:w-[65%] border-none outline-none shadow-none justify-between"
        >
          {selectedTeam ? (
            <div className="flex items-center gap-3">
              <div className="rounded-full flex justify-center items-center text-[#212e42] w-[26px] h-[26px]">
                <h2 className="!font-[500] !text-[0.80rem] ml-12 text-muted-foreground">
                  {selectedTeam.name}
                </h2>
              </div>
            </div>
          ) : (
            <h2 className="text-muted-foreground">Select Team...</h2>
          )}
          <ChevronsUpDown className="ml-8 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0 bg-white shadow-xl rounded-lg z-[1000000] border">
        <Command className="p-2 bg-transparent">
          <CommandInput
            placeholder="Search team..."
            className="outline-none border-0"
            value={search}
            onValueChange={(value) => setSearch(value)}
          />
          <CommandList>
            <CommandEmpty className="text-sm">No team found.</CommandEmpty>
            <CommandGroup>
              {teams
                ?.filter((t) =>
                  t.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((t) => (
                  <CommandItem
                    key={t.id}
                    value={t.name}
                    onSelect={() => handleSelectTeam(t)}
                    className="flex items-center justify-between gap-1 p-2 cursor-pointer"
                  >
                    <h2 className="!font-[500] !text-[0.80rem] ml-3">
                      {t.name}
                    </h2>
                    <Check
                      className={`ml-2 h-4 w-4 ${selectedTeam?.id === t.id ? "opacity-100" : "opacity-0"}`}
                    />
                  </CommandItem>
                ))}
              <CommandItem
                key="unassign"
                value="Unassign Team"
                onSelect={() => handleSelectTeam(null)}
                className="flex items-center justify-between gap-1 p-2 cursor-pointer"
              >
                <h2 className="!font-[500] !text-[0.80rem] ml-3">
                  Unassign Team
                </h2>
                <Check
                  className={`ml-2 h-4 w-4 ${!selectedTeam ? "opacity-100" : "opacity-0"}`}
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
