import { renderTaskStatusChip } from "@/app/tasks/[taskId]/task-status-chips";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mergeFirstLetters } from "@/utils/stringOpeartion";
import { format, isValid } from "date-fns";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import React from "react";
import { FaRegClock, FaRegUser, FaUser } from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { LuLoader } from "react-icons/lu";
import { MdOutlineStackedLineChart } from "react-icons/md";
import CCSelection from "./CCSelection";

export interface User {
  id: string;
  name: string;
  email?: string;
  skills?: string[];
}

export interface TaskFormFieldsProps {
  // Task Details
  taskStatus: string | number;
  onTaskStatusChange: (status: string) => void;
  isChangingTaskStatus?: boolean;

  // Date fields
  startDate: Date | null;
  onStartDateChange: (date: Date) => void;
  dueDate: Date | null;
  onDueDateChange: (date: Date) => void;

  // Priority
  priority: string;
  onPriorityChange: (priority: string) => void;

  // Assignee
  assignee: { id: string; name: string } | null;
  onAssigneeChange: (userId: string) => void;
  workspaceUsers: User[];

  // CC Users
  ccUsers?: { id: string; name: string }[];
  onCCUsersChange?: (users: { id: string; name: string }[]) => void;

  // Auto assign
  onAutomaticAssign?: () => void;
  isSelectingAssignee?: boolean;

  // Created at (optional)
  createdAt?: string;

  // Last updated (optional)
  lastUpdatedBy?: { id: string; name: string };
  lastUpdatedTime?: string;

  // Mode (new or edit)
  mode: "new" | "edit";
  hideAssigneeSection?: boolean;

  // Restrict due date editing
  dueDateDisabled?: boolean;
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  taskStatus,
  onTaskStatusChange,
  isChangingTaskStatus = false,

  startDate,
  onStartDateChange,
  dueDate,
  onDueDateChange,

  priority,
  onPriorityChange,

  assignee,
  onAssigneeChange,
  workspaceUsers,

  ccUsers = [],
  onCCUsersChange,

  onAutomaticAssign,
  isSelectingAssignee = false,

  createdAt,
  lastUpdatedBy,
  lastUpdatedTime,

  mode,
  hideAssigneeSection = false,
  dueDateDisabled = false,
}) => {
  const [assigneePopoverOpen, setAssigneePopoverOpen] = React.useState(false);

  // Create a display name for unassigned
  const displayAssignee = assignee?.id
    ? assignee
    : { id: "", name: "unassigned" };

  const AVATAR_COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
  const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Created At - only shown in edit mode */}
      {mode === "edit" && createdAt && (
        <div className="w-full h-[40px] flex gap-3">
          <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
            <FaRegClock size={15} />
            <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
              Created At
            </p>
          </div>
          <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f]">
            <div className="w-full rounded-[5px] hover:bg-[#efefef] base:text-[0.84rem] ttl:text-[0.91rem] h-full flex items-center pl-[7px]">
              <p>{createdAt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="w-full h-[40px] flex gap-3">
        <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
          <LuLoader size={15} />
          <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
            Status
          </p>
        </div>
        <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f]">
          <Select
            value={String(taskStatus)}
            onValueChange={onTaskStatusChange}
            disabled={isChangingTaskStatus}
          >
            <SelectTrigger className="focus-visible:ring-offset-0 focus-visible:ring-0 !outline-none focus:border-none w-full h-full pl-[7px] border-none shadow-none rounded-[7px] hover:bg-[#efefef]">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                {["0", "1", "2", "3"].map((it) => (
                  <SelectItem key={it} value={it}>
                    {renderTaskStatusChip(Number(it))}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start Date */}
      <div className="w-full h-[40px] flex gap-3">
        <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
          <IoCalendarOutline size={15} />
          <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
            Start Date
          </p>
        </div>
        <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[100%] border-none shadow-none pl-[7px] justify-start text-left font-normal base:text-[0.85rem] ttl:text-[0.92rem] hover:bg-[#efefef]",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate && isValid(startDate) ? (
                  format(startDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Due Date */}
      <div className="w-full h-[40px] flex gap-3">
        <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
          <IoCalendarOutline size={15} />
          <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
            Due Date
          </p>
        </div>
        <div className="base:w-[65%] tv:w-[72%] h-full flex flex-col rounded-[5px] text-[#37352f]">
          <Popover>
            <PopoverTrigger asChild disabled={dueDateDisabled}>
              <Button
                variant={"outline"}
                disabled={dueDateDisabled}
                title={dueDateDisabled ? "Only the task creator can change the due date" : undefined}
                className={cn(
                  "w-[100%] border-none shadow-none pl-[7px] justify-start text-left font-normal base:text-[0.85rem] ttl:text-[0.92rem] hover:bg-[#efefef]",
                  !dueDate && "text-muted-foreground",
                  dueDateDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {dueDate && isValid(dueDate) ? (
                  format(dueDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                {mode === "new" && (
                  <div className="mb-2 text-xs text-muted-foreground">
                    Due date must be after today
                  </div>
                )}
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={onDueDateChange}
                  disabled={(date) => {
                    if (startDate && isValid(startDate)) {
                      const start = new Date(startDate);
                      return date < start;
                    }
                    if (mode === "new") {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }
                    return false;
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>

          {startDate &&
            dueDate &&
            isValid(startDate) &&
            isValid(dueDate) &&
            dueDate < startDate && (
              <p className="text-red-500 text-sm mt-1">
                Due date cannot be earlier than start date.
              </p>
            )}
        </div>
      </div>

      {/* Priority */}
      <div className="w-full h-[40px] flex gap-3">
        <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
          <MdOutlineStackedLineChart size={15} />
          <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
            Priority
          </p>
        </div>
        <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f]">
          <Select value={priority} onValueChange={onPriorityChange}>
            <SelectTrigger className="focus-visible:ring-offset-0 focus-visible:ring-0 !outline-none focus:border-none h-full w-full pl-[7px] border-none shadow-none rounded-[7px] hover:bg-[#efefef]">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Priority</SelectLabel>
                <SelectItem value="Low">
                  <div style={{ background: "#dcfce7", border: "1px solid #86efac" }} className="shadow-sm py-[2px] px-[10px] rounded-[25px] flex gap-1 items-center justify-center">
                    <div style={{ background: "#22c55e" }} className="rounded-full h-[8px] w-[8px]"></div>
                    <p style={{ color: "#15803d" }} className="text-[0.7rem] tracking-wide font-[500]">
                      Low
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div style={{ background: "#fef3c7", border: "1px solid #fde68a" }} className="shadow-sm py-[1px] px-[10px] rounded-[25px] flex gap-1 items-center justify-center">
                    <div style={{ background: "#f59e0b" }} className="rounded-full h-[8px] w-[8px]"></div>
                    <p style={{ color: "#b45309" }} className="text-[0.7rem] font-[500] tracking-wide">
                      Medium
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="High">
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5" }} className="shadow-sm py-[2px] px-[10px] rounded-[25px] flex gap-1 items-center justify-center">
                    <div style={{ background: "#ef4444" }} className="rounded-full h-[8px] w-[8px]"></div>
                    <p style={{ color: "#b91c1c" }} className="text-[0.7rem] tracking-wide font-[500]">
                      High
                    </p>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignee */}
      {!hideAssigneeSection && (
        <div className="w-full h-[40px] flex gap-3">
          <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
            <FaRegUser size={15} />
            <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
              Assignee
            </p>
          </div>

          <Popover
            open={assigneePopoverOpen}
            onOpenChange={setAssigneePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="base:w-[65%] tv:w-[72%] border-none outline-none shadow-none justify-between"
              >
                <div className="flex ml-[-8px] items-center gap-3">
                  {!displayAssignee.id ? (
                    <div className="bg-[#edeef3] rounded-full flex justify-center items-center w-[26px] h-[26px]">
                      <FaUser size={15} color="#c0c7d1" />
                    </div>
                  ) : (
                    <div className="rounded-full flex justify-center items-center text-white w-[26px] h-[26px]" style={{ background: avatarBg(displayAssignee.name) }}>
                      <h2 className="!font-[500] !text-[0.67rem]">
                        {mergeFirstLetters(displayAssignee.name)}
                      </h2>
                    </div>
                  )}
                  <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                    {displayAssignee.name}
                  </p>
                </div>

                <ChevronsUpDown className="ml-8 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 max-h-[400px] overflow-hidden">
              <Command className="max-h-[400px] overflow-hidden">
                <CommandInput placeholder="Search Member..." />
                <CommandList className="max-h-[340px] overflow-y-auto">
                  <CommandEmpty>No Member found.</CommandEmpty>
                  {onAutomaticAssign && (
                    <>
                      {isSelectingAssignee ? (
                        <Button className="flex m-auto my-2 items-center justify-center p-2 flex-nowrap text-[0.8rem] text-white tracking-wide font-[500]">
                          <LoaderCircle className="animate-spin mr-2" />
                          Selecting...
                        </Button>
                      ) : (
                        <Button
                          onClick={onAutomaticAssign}
                          className="flex m-auto my-2 items-center justify-center p-2 flex-nowrap text-[0.8rem] text-white tracking-wide font-[500]"
                        >
                          Select Assignee Automatically
                        </Button>
                      )}
                    </>
                  )}
                  <CommandGroup>
                    {workspaceUsers.length > 0 &&
                      workspaceUsers.map((user: User) => (
                        <CommandItem
                          key={user.id || "unassigned"}
                          value={`${user.name}-${user.email || ""}`}
                          onSelect={() => {
                            onAssigneeChange(user.id);
                            setAssigneePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              displayAssignee.id === user.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-3">
                            {!user.id ? (
                              <div className="bg-[#edeef3] rounded-full flex justify-center items-center w-[26px] h-[26px]">
                                <FaUser size={15} color="#c0c7d1" />
                              </div>
                            ) : (
                              <div className="rounded-full flex justify-center items-center text-white w-[26px] h-[26px] uppercase" style={{ background: avatarBg(user.name) }}>
                                <h2 className="!font-[500] !text-[0.67rem]">
                                  {mergeFirstLetters(user.name)}
                                </h2>
                              </div>
                            )}
                            <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground">
                              {user.name}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* CC Users */}
      {onCCUsersChange && (
        <div className="w-full h-min-[40px] flex gap-3">
          <div className="base:w-[35%] tv:w-[28%] h-[40px] rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
            <FaRegUser size={15} />
            <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
              CC
            </p>
          </div>
          <div className="base:w-[65%] tv:w-[72%] flex items-center">
            <CCSelection
              ccUsers={ccUsers}
              onCCUsersChange={onCCUsersChange}
              workspaceUsers={workspaceUsers}
            />
          </div>
        </div>
      )}

      {/* Last Updated - only shown in edit mode */}
      {mode === "edit" && lastUpdatedBy && lastUpdatedTime && (
        <div className="w-full h-[40px] flex gap-3">
          <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
            <FaRegClock size={15} />
            <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
              Last updated
            </p>
          </div>
          <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f]">
            <div className="w-full rounded-[5px] hover:bg-[#efefef] base:text-[0.84rem] ttl:text-[0.91rem] h-full flex items-center pl-[7px]">
              <p>
                By {lastUpdatedBy.name} at {lastUpdatedTime}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFormFields;
