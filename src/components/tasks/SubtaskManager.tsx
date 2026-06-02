import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { ListTree, Plus, StickyNote, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export interface Task {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SubtaskManagerProps {
  // Data
  availableTasks: Task[];
  selectedSubtaskIds: string[];

  // Mode
  mode: "new" | "edit";
  parentTaskId?: string;

  // Actions
  onAddSubtask: (taskId: string) => Promise<void>;
  onRemoveSubtask: (taskId: string) => Promise<void>;
  onCreateSubtask?: (name: string) => Promise<void>;

  // UI State
  isLoading?: boolean;
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({
  availableTasks,
  selectedSubtaskIds,
  mode,
  parentTaskId,
  onAddSubtask,
  onRemoveSubtask,
  onCreateSubtask,
  isLoading = false,
}) => {
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtask, setNewSubtask] = useState(false);

  // Filter tasks that are selected as subtasks
  const selectedTasks = availableTasks.filter((task) =>
    selectedSubtaskIds.includes(task.id)
  );

  // Filter tasks that are not selected as subtasks
  const remainingTasks = availableTasks.filter(
    (task) => !selectedSubtaskIds.includes(task.id)
  );

  const handleCreateSubtask = async () => {
    if (!onCreateSubtask) return;

    if (!newSubtaskName.trim()) {
      return;
    }

    await onCreateSubtask(newSubtaskName);
    setNewSubtask(false);
    setNewSubtaskName("");
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Subtask heading */}
      <div className="w-full h-[40px] flex gap-3">
        <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
          <ListTree size={15} />
          <p className="base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
            Sub-tasks
          </p>
        </div>
        {/* Add Subtask button */}
        <div className="base:w-[65%] tv:w-[72%] h-full flex flex-row-reverse items-center">
          <AlertDialog
            open={isSubtaskModalOpen}
            onOpenChange={setIsSubtaskModalOpen}
          >
            <AlertDialogTrigger asChild disabled={isLoading}>
              <Plus
                className="cursor-pointer p-[3px] hover:bg-[#efefef] rounded-full"
                size={24}
                color="#777672"
              />
            </AlertDialogTrigger>

            <AlertDialogContent>
              <Command>
                {/* Search bar */}
                <CommandInput placeholder="Search task by name" />
                <CommandList>
                  <CommandEmpty>No task found</CommandEmpty>

                  {/* New subtask section */}
                  {onCreateSubtask && (
                    <CommandGroup heading="Create a new sub-task">
                      {newSubtask ? (
                        <div className="flex flex-col items-start justify-center gap-y-2 px-2 py-1.5">
                          <Textarea
                            value={newSubtaskName}
                            onChange={(e) => setNewSubtaskName(e.target.value)}
                            placeholder="Sub-task"
                            className="border px-4 py-2 rounded w-full"
                          />
                          <div className="flex items-center justify-center gap-x-2">
                            <Button onClick={handleCreateSubtask}>
                              Create
                            </Button>
                            <Button
                              className="bg-white border border-red-600 text-red-600 hover:bg-red-50"
                              onClick={() => setNewSubtask(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-2 py-1.5">
                          <Button onClick={() => setNewSubtask(true)}>
                            New Subtask
                          </Button>
                        </div>
                      )}
                    </CommandGroup>
                  )}

                  {/* Selected Tasks */}
                  <CommandGroup heading="Selected">
                    {selectedTasks?.length > 0 ? (
                      selectedTasks.map((task: Task) => (
                        <CommandItem key={task.id} value={task.name}>
                          <div className="flex items-center gap-3 justify-between w-full">
                            <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                              {task.name}
                            </p>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemoveSubtask(task.id);
                              }}
                            >
                              <Trash2 className="w-5 h-5 text-[#364258]/50 p-0.5 hover:bg-gray-300 rounded-md" />
                            </button>
                          </div>
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem>
                        <div className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                          No tasks selected
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
                  <CommandSeparator />

                  {/* Available Tasks */}
                  <CommandGroup heading="Choose sub tasks">
                    {remainingTasks?.length > 0 ? (
                      remainingTasks.map((task: Task) => (
                        <CommandItem key={task.id} value={task.name}>
                          <div className="flex items-center gap-3 justify-between w-full">
                            <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                              {task.name}
                            </p>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAddSubtask(task.id);
                              }}
                            >
                              <Plus className="w-5 h-5 text-[#364258]/50 p-0.5 hover:bg-gray-300 rounded-md" />
                            </button>
                          </div>
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem>
                        <div className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                          No tasks available
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>

              <div className="flex mt-4 gap-3 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Done</AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* List of subtasks */}
      {selectedTasks.length > 0 ? (
        <div className="w-full flex flex-col">
          {selectedTasks.map((task) => (
            <div
              className="flex px-3 py-2 gap-4 group rounded-md hover:bg-[#efefef] justify-between"
              key={task.id}
            >
              <div className="flex items-center gap-2">
                <StickyNote size={18} color="#9d9c99" />
                {mode === "edit" ? (
                  <Link
                    href={`/home/tasks/${task.id}`}
                    className="text-[0.75rem] tll:text-[0.85rem] font-[400] hover:underline hover:cursor-pointer"
                  >
                    {task.name}
                  </Link>
                ) : (
                  <span className="text-[0.75rem] tll:text-[0.85rem] font-[400]">
                    {task.name}
                  </span>
                )}
              </div>
              <div className="flex justify-center items-center">
                <button
                  onClick={() => onRemoveSubtask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-5 h-5 text-[#364258]/50 p-0.5 hover:bg-gray-300 rounded-md" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex items-end justify-center">
          <p className="text-[0.8rem] text-[#364258]/50">No sub-tasks</p>
        </div>
      )}
    </div>
  );
};

export default SubtaskManager;
