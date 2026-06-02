import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { mergeFirstLetters } from "@/utils/stringOpeartion";
import { Check, ChevronsUpDown, X } from "lucide-react";
import React, { useState } from "react";
import { FaUser } from "react-icons/fa6";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface CCSelectionProps {
  ccUsers: User[];
  onCCUsersChange: (users: User[]) => void;
  workspaceUsers: User[];
  disabled?: boolean;
}

const CCSelection: React.FC<CCSelectionProps> = ({
  ccUsers,
  onCCUsersChange,
  workspaceUsers,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const handleUserToggle = (user: User) => {
    const isSelected = ccUsers.some((ccUser) => ccUser.id === user.id);

    if (isSelected) {
      // Remove user from CC list
      onCCUsersChange(ccUsers.filter((ccUser) => ccUser.id !== user.id));
    } else {
      // Add user to CC list
      onCCUsersChange([...ccUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onCCUsersChange(ccUsers.filter((ccUser) => ccUser.id !== userId));
  };

  // Filter out users already in CC and unassigned option
  const availableUsers = workspaceUsers.filter((user) => user.id !== "");

  return (
    <div className="w-full space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-none outline-none shadow-none justify-between h-auto min-h-[40px] py-2"
            disabled={disabled}
          >
            <div className="flex ml-[-8px] items-center gap-2 flex-wrap">
              {ccUsers.length === 0 ? (
                <>
                  <div className="bg-[#edeef3] rounded-full flex justify-center items-center w-[26px] h-[26px]">
                    <FaUser size={15} color="#c0c7d1" />
                  </div>
                  <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                    No CC users
                  </p>
                </>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {ccUsers.slice(0, 3).map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <div className="bg-[#ff9920] rounded-full flex justify-center items-center text-[#212e42] w-[16px] h-[16px]">
                        <span className="text-[0.5rem] font-[500]">
                          {mergeFirstLetters(user.name)}
                        </span>
                      </div>
                      <span>{user.name}</span>
                      <X
                        size={12}
                        className="cursor-pointer hover:bg-gray-200 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUser(user.id);
                        }}
                      />
                    </Badge>
                  ))}
                  {ccUsers.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{ccUsers.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 max-h-[400px] overflow-hidden">
          <Command className="max-h-[400px] overflow-hidden">
            <CommandInput placeholder="Search users..." />
            <CommandList className="max-h-[340px] overflow-y-auto">
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {availableUsers.map((user) => {
                  const isSelected = ccUsers.some(
                    (ccUser) => ccUser.id === user.id
                  );
                  return (
                    <CommandItem
                      key={user.id}
                      value={`${user.name}-${user.email || ""}`}
                      onSelect={() => handleUserToggle(user)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          isSelected ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex items-center gap-3">
                        <div className="bg-[#ff9920] rounded-full flex justify-center items-center text-[#212e42] w-[26px] h-[26px] uppercase">
                          <h2 className="!font-[500] !text-[0.67rem]">
                            {mergeFirstLetters(user.name)}
                          </h2>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground">
                            {user.name}
                          </p>
                          {user.email && (
                            <p className="text-[0.7rem] text-gray-500">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CCSelection;
