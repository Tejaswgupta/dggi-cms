import { deleteTaskData } from "@/apiReq/newAPIs/task-new";
import {
  getTaskCustomFieldTemplates,
  TaskCustomFieldTemplate,
} from "@/apiReq/newAPIs/taskCustomFields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TASK_STATUS_LABELS } from "@/constants/task";
import useWorkspaceTeams from "@/hooks/useWorkspaceTeams";
import useWorkspaceUsers from "@/hooks/useWorkspaceUsers";
import { cn } from "@/lib/utils";
import {
  ListViewProps,
  PRIORITY_ORDER,
  SortField,
  SortState,
  STATUS_ORDER,
  Task,
} from "@/types/task";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ListFilter,
  MoveDown,
  MoveUp,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import SkeletonforTable from "./SkeletonForTable";
import TaskRow from "./TaskRow";

interface FilterOption {
  type: SortField;
  value: string;
  label: string;
}

type GroupByOption =
  | null
  | "status"
  | { fieldLabel: string; templateName: string };

const PAGE_SIZE = 15;

const NewListViewComponent: React.FC<ListViewProps> = ({
  ListTasks,
  setListTasks,
  skeletonLoaderForTable,
  userData,
  onSelectionChange,
  selectionResetKey,
  showIndexColumn = true,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    order: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(ListTasks);
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByOption>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [cfTemplates, setCfTemplates] = useState<TaskCustomFieldTemplate[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalColumns = showIndexColumn ? 9 : 8;

  // For filters
  const workspaceUsers = useWorkspaceUsers() || [];
  const workspaceTeams = useWorkspaceTeams() || [];

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    getTaskCustomFieldTemplates().then((res) => {
      if (res.success) setCfTemplates(res.data);
    });
  }, []);

  // Reset selected tasks when ListTasks changes
  useEffect(() => {
    setSelectedTasks(new Set());
    setFilteredTasks(ListTasks);
    setCurrentPage(1);
  }, [ListTasks]);

  // Apply filters when active filters change
  useEffect(() => {
    let result = [...ListTasks];

    // Filter out completed tasks if not showing completed
    if (!showCompleted) {
      result = result.filter((task) => task.status !== 3);
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.taskContent || "").toLowerCase().includes(query),
      );
    }

    // Apply each active filter
    activeFilters.forEach((filter) => {
      switch (filter.type) {
        case "assignee":
          result = result.filter(
            (task) => task.assigned_to && task.assigned_to.id === filter.value,
          );
          break;
        case "team":
          // Filter by team ID
          result = result.filter((task) => {
            // Using type assertion since task.team_id might not be in the Task interface
            return (task as any).team_id === filter.value;
          });
          break;
        case "client":
          // Filter by client ID
          result = result.filter((task) => {
            // Using type assertion since task.client_id might not be in the Task interface
            return (task as any).client_id === filter.value;
          });
          break;
        case "source":
          result = result.filter(
            (task) => ((task as any).source ?? "manual") === filter.value,
          );
          break;
        case "title":
          result = result.filter((task) =>
            task.name.toLowerCase().includes(filter.value.toLowerCase()),
          );
          break;
        case "description":
          result = result.filter((task) =>
            (task.taskContent || "")
              .toLowerCase()
              .includes(filter.value.toLowerCase()),
          );
          break;
      }
    });

    setFilteredTasks(result);
    setCurrentPage(1);
  }, [activeFilters, ListTasks, searchQuery, showCompleted]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  }, [filteredTasks.length]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTasks, startIndex]);

  const paginatedTasksWithIndex = useMemo(() => {
    return paginatedTasks.map((task, index) => ({
      task,
      index: startIndex + index,
    }));
  }, [paginatedTasks, startIndex]);

  const isAllSelected = useMemo(() => {
    return (
      paginatedTasks.length > 0 &&
      paginatedTasks.every((task) => selectedTasks.has(task.id))
    );
  }, [paginatedTasks, selectedTasks]);

  const handleSelectAll = useCallback(() => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        paginatedTasks.forEach((task) => next.delete(task.id));
      } else {
        paginatedTasks.forEach((task) => next.add(task.id));
      }
      return next;
    });
  }, [isAllSelected, paginatedTasks]);

  const addFilter = (type: SortField, value: string, label: string) => {
    // Don't add duplicate filters
    if (!activeFilters.some((f) => f.type === type && f.value === value)) {
      setActiveFilters([...activeFilters, { type, value, label }]);
    }
  };

  const removeFilter = (index: number) => {
    const newFilters = [...activeFilters];
    newFilters.splice(index, 1);
    setActiveFilters(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery("");
    setSearchInputValue("");
  };

  const handleSearch = () => {
    setSearchQuery(searchInputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedTasks.size === 0) return;

    // Filter tasks to only include those created by the current user
    const tasksToDelete = ListTasks.filter(
      (task) =>
        selectedTasks.has(task.id) && task.created_by_user?.id === userData?.id,
    );

    // If no tasks can be deleted, show an error
    if (tasksToDelete.length === 0) {
      toast.error("You can only delete tasks that you created.");
      return;
    }

    // Show warning if some selected tasks cannot be deleted
    const tasksNotOwned = selectedTasks.size - tasksToDelete.length;
    if (tasksNotOwned > 0) {
      toast.warn(
        `You can only delete tasks that you created. Skipping ${tasksNotOwned} task(s).`,
      );
    }

    // Open confirmation dialog
    setIsDeleteAlertOpen(true);
  }, [ListTasks, selectedTasks, userData]);

  const confirmDeleteSelected = useCallback(async () => {
    try {
      setIsDeleting(true);

      // Filter tasks to only include those created by the current user
      const tasksToDelete = ListTasks.filter(
        (task) =>
          selectedTasks.has(task.id) &&
          task.created_by_user?.id === userData?.id,
      );

      const deletePromises = tasksToDelete.map((task) =>
        deleteTaskData(task.id),
      );

      await Promise.all(deletePromises);

      // Update both list and board views
      const updatedTasks = ListTasks.filter(
        (task) => !tasksToDelete.some((t) => t.id === task.id),
      );
      setListTasks(updatedTasks);

      setSelectedTasks(new Set());
      setIsDeleteAlertOpen(false);
      toast.success("Tasks deleted successfully");
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [ListTasks, selectedTasks, setListTasks, userData]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(new Set(selectedTasks));
    }
  }, [onSelectionChange, selectedTasks]);

  useEffect(() => {
    if (selectionResetKey !== undefined) {
      setSelectedTasks(new Set());
    }
  }, [selectionResetKey]);

  const handleSort = useCallback(
    (field: SortField) => {
      setSortState((prev) => {
        const newOrder =
          prev.field === field && prev.order === "asc" ? "desc" : "asc";
        return { field, order: newOrder };
      });

      const sortedTasks = [...filteredTasks];

      switch (field) {
        case "title":
          sortedTasks.sort((a, b) => {
            const comparison = a.name.localeCompare(b.name);
            return sortState.order === "asc" ? comparison : -comparison;
          });
          break;
        case "dueDate":
          sortedTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            const comparison =
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            return sortState.order === "asc" ? comparison : -comparison;
          });
          break;
        case "status":
          sortedTasks.sort((a, b) => {
            const comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
            return sortState.order === "asc" ? comparison : -comparison;
          });
          break;
        case "priority":
          sortedTasks.sort((a, b) => {
            const priorityOrder =
              PRIORITY_ORDER[sortState.order === "asc" ? "asc" : "desc"];
            const aIndex = priorityOrder.indexOf(a.priority);
            const bIndex = priorityOrder.indexOf(b.priority);
            return aIndex - bIndex;
          });
          break;
        case "assignee":
          sortedTasks.sort((a, b) => {
            const aName = a.assigned_to?.name || "";
            const bName = b.assigned_to?.name || "";
            const comparison = aName.localeCompare(bName);
            return sortState.order === "asc" ? comparison : -comparison;
          });
          break;
        case "creator":
          sortedTasks.sort((a, b) => {
            const aName = a.created_by_user?.name || "";
            const bName = b.created_by_user?.name || "";
            const comparison = aName.localeCompare(bName);
            return sortState.order === "asc" ? comparison : -comparison;
          });
          break;
      }

      setFilteredTasks(sortedTasks);
    },
    [filteredTasks, sortState.order],
  );

  const renderSortIcon = (field: SortField) => {
    const isActive = sortState.field === field;
    const Icon =
      sortState.field === field && sortState.order === "asc"
        ? ArrowUp
        : sortState.field === field
          ? ArrowDown
          : ChevronsUpDown;

    return (
      <Icon
        size={14}
        className={cn(
          "text-[#b0b0aa] transition-colors group-hover:text-[#6b6b6b]",
          isActive && "text-[#4A5FD4]",
        )}
      />
    );
  };

  const renderSortButton = (field: SortField, label: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className="group flex items-center gap-2 rounded-md px-1.5 py-1 text-xs font-medium text-[#1a1a1a] outline-none transition hover:bg-[#F3F2EF]"
      >
        <span className="leading-none">{label}</span>
        {renderSortIcon(field)}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="flex items-center gap-1"
          onClick={() => handleSort(field)}
        >
          <MoveUp size={12} />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-1"
          onClick={() => handleSort(field)}
        >
          <MoveDown size={12} />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full flex flex-col gap-4 pb-10 px-0 bg-white">
      <div
        id="tasks-search-header"
        className="sticky top-0 z-20 w-full rounded-2xl border border-[#EDEDEA] bg-white px-5 py-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Input
              placeholder="Search tasks..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 rounded-lg border-[#EDEDEA] bg-white pl-10 pr-10 text-sm placeholder:text-[#b0b0aa] focus-visible:ring-0 focus-visible:border-[#4A5FD4]"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-[#9a9a96]" />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 transform rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              "h-10 w-10 rounded-lg border-[#EDEDEA] bg-white p-0 text-[#6b6b6b] hover:bg-[#F3F2EF]",
              isFiltersOpen && "bg-[#EEF2FF] text-[#4A5FD4] border-[#4A5FD4]",
            )}
          >
            <ListFilter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter controls */}
        {isFiltersOpen && (
          <div className="mt-4 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Assignee filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 rounded-lg border-[#EDEDEA] bg-white px-4 text-sm font-medium text-[#6b6b6b] transition hover:bg-[#F3F2EF]",
                    activeFilters.some((f) => f.type === "assignee") &&
                      "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]",
                  )}
                >
                  Assignee
                  <ChevronDown className="ml-2 h-4 w-4 text-[#9a9a96]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No users found</CommandEmpty>
                    <CommandGroup>
                      {workspaceUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() =>
                            addFilter(
                              "assignee",
                              user.id,
                              `Assignee: ${user.name}`,
                            )
                          }
                        >
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Team filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 rounded-lg border-[#EDEDEA] bg-white px-4 text-sm font-medium text-[#6b6b6b] transition hover:bg-[#F3F2EF]",
                    activeFilters.some((f) => f.type === "team") &&
                      "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]",
                  )}
                >
                  Team
                  <ChevronDown className="ml-2 h-4 w-4 text-[#9a9a96]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search teams..." />
                  <CommandList>
                    <CommandEmpty>No teams found</CommandEmpty>
                    <CommandGroup>
                      {workspaceTeams.map((team) => (
                        <CommandItem
                          key={team.id}
                          onSelect={() =>
                            addFilter("team", team.id, `Team: ${team.name}`)
                          }
                        >
                          {team.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Source filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 rounded-lg border-[#EDEDEA] bg-white px-4 text-sm font-medium text-[#6b6b6b] transition hover:bg-[#F3F2EF]",
                    activeFilters.some((f) => f.type === "source") &&
                      "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]",
                  )}
                >
                  Source
                  <ChevronDown className="ml-2 h-4 w-4 text-[#9a9a96]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[160px] p-1" align="start">
                {(["email", "whatsapp", "manual"] as const).map((src) => (
                  <button
                    key={src}
                    className="w-full rounded-md px-3 py-1.5 text-left text-sm text-[#1a1a1a] hover:bg-[#F3F2EF] capitalize"
                    onClick={() =>
                      addFilter(
                        "source",
                        src,
                        `Source: ${src.charAt(0).toUpperCase() + src.slice(1)}`,
                      )
                    }
                  >
                    {src.charAt(0).toUpperCase() + src.slice(1)}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-[#EDEDEA]" />

            <div className="flex items-center space-x-2">
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label
                htmlFor="show-completed"
                className="text-sm font-medium text-[#6b6b6b] cursor-pointer"
              >
                Show Completed
              </Label>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 rounded-lg border-[#EDEDEA] bg-white px-4 text-sm font-medium text-[#6b6b6b] transition hover:bg-[#F3F2EF]",
                    groupBy !== null &&
                      "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]",
                  )}
                >
                  Group:{" "}
                  {groupBy === null
                    ? "None"
                    : groupBy === "status"
                      ? "Status"
                      : `${(groupBy as { fieldLabel: string; templateName: string }).templateName}: ${(groupBy as { fieldLabel: string; templateName: string }).fieldLabel}`}
                  <ChevronDown className="ml-2 h-4 w-4 text-[#9a9a96]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search fields..." />
                  <CommandList>
                    <CommandEmpty>No fields found</CommandEmpty>
                    <CommandGroup heading="Standard">
                      <CommandItem onSelect={() => setGroupBy(null)}>
                        None
                      </CommandItem>
                      <CommandItem onSelect={() => setGroupBy("status")}>
                        Status
                      </CommandItem>
                    </CommandGroup>
                    {cfTemplates.map((template) => (
                      <CommandGroup key={template.id} heading={template.name}>
                        {template.fields.map((field) => (
                          <CommandItem
                            key={field.label}
                            onSelect={() =>
                              setGroupBy({
                                fieldLabel: field.label,
                                templateName: template.name,
                              })
                            }
                          >
                            {field.label}
                            <span className="ml-auto text-xs text-[#b0b0aa] capitalize">
                              {field.type}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${filter.type}-${filter.value}`}
                variant="secondary"
                className="flex items-center gap-1 rounded-full border border-[#EDEDEA] bg-[#F3F2EF] px-3 py-1 text-xs font-medium text-[#6b6b6b]"
              >
                {filter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-5 w-5 rounded-full p-0 text-[#9a9a96] hover:bg-[#DEDBD5]"
                  onClick={() => removeFilter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg px-3 text-xs font-medium text-[#6b6b6b] hover:bg-[#F3F2EF]"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Search info */}
        {searchQuery && (
          <Badge
            variant="outline"
            className="mt-1 rounded-full border-[#EDEDEA] bg-[#F3F2EF] px-3 py-1 text-xs text-[#6b6b6b]"
          >
            Search: "{searchQuery}"
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-5 w-5 rounded-full p-0 text-[#9a9a96] hover:bg-[#DEDBD5]"
              onClick={() => {
                setSearchQuery("");
                setSearchInputValue("");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
      </div>

      {selectedTasks.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#EEF2FF] bg-[#EEF2FF] px-3 py-2 text-sm font-medium text-[#4A5FD4]">
          <span>{selectedTasks.size} selected</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-3 text-xs text-[#4A5FD4] hover:bg-[#EEF2FF]"
              onClick={() => setSelectedTasks(new Set())}
            >
              Clear selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-[#EDEDEA] bg-white px-3 text-xs text-[#6b6b6b] hover:bg-[#F3F2EF]"
              onClick={() => setIsDeleteAlertOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting
                ? "Deleting..."
                : `Delete selected (${selectedTasks.size})`}
            </Button>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-2xl border border-[#EDEDEA] bg-white">
        <Table className="relative overflow-hidden">
          <TableCaption className="text-xs text-[#b0b0aa] text-center py-3">
            List of your recent tasks.
          </TableCaption>
          <TableHeader className="sticky top-0 z-10 bg-white border-b border-[#EDEDEA]">
            <TableRow className="h-[44px] text-sm font-semibold text-[#1a1a1a] bg-white hover:bg-white">
              <TableHead className="w-[56px] px-3 py-2 first:pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-[#DEDBD5] accent-[#4A5FD4] data-[state=checked]:border-[#4A5FD4] data-[state=checked]:bg-[#4A5FD4]"
                  />
                  {selectedTasks.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-lg p-0 text-[#6b6b6b] hover:bg-[#F3F2EF]"
                          disabled={isDeleting}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => setIsDeleteAlertOpen(true)}
                          disabled={isDeleting}
                          className="text-destructive focus:text-destructive flex items-center gap-2"
                        >
                          {isDeleting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete selected ({selectedTasks.size})
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableHead>
              {showIndexColumn && (
                <TableHead className="w-[52px] px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                  #
                </TableHead>
              )}
              <TableHead className="px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider first:pl-4">
                {renderSortButton("title", "Title")}
              </TableHead>
              <TableHead className="px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                {renderSortButton("description", "Description")}
              </TableHead>
              <TableHead className="px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                {renderSortButton("dueDate", "Due Date")}
              </TableHead>
              <TableHead className="px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                {renderSortButton("status", "Status")}
              </TableHead>
              <TableHead className="px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                {renderSortButton("priority", "Priority")}
              </TableHead>
              <TableHead className="px-3 py-2 text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                {renderSortButton("assignee", "Assignee")}
              </TableHead>
              <TableHead className="px-3 py-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* {!skeletonLoaderForTable && (
              <InlineTaskCreator
                ListTasks={ListTasks}
                setListTasks={setListTasks}
                userData={userData}
                workspaceUsers={workspaceUsers}
                showIndexColumn={showIndexColumn}
              />
            )} */}
            {skeletonLoaderForTable && (
              <SkeletonforTable showIndexColumn={showIndexColumn} />
            )}
            {!skeletonLoaderForTable &&
              groupBy === null &&
              paginatedTasksWithIndex.length > 0 &&
              paginatedTasksWithIndex.map(({ task, index }) => (
                <TaskRow
                  key={task.id}
                  userData={userData}
                  ListTasks={filteredTasks}
                  setListTasks={setListTasks}
                  task={task}
                  index={index}
                  showIndexColumn={showIndexColumn}
                  setCheckList={(newChecks) => {
                    const taskId = filteredTasks[index].id;
                    setSelectedTasks((prev) => {
                      const next = new Set(prev);
                      if (newChecks[index]) {
                        next.add(taskId);
                      } else {
                        next.delete(taskId);
                      }
                      return next;
                    });
                  }}
                  checkList={filteredTasks.map((t) => selectedTasks.has(t.id))}
                  workspaceUsers={workspaceUsers}
                />
              ))}

            {!skeletonLoaderForTable &&
              groupBy === "status" &&
              paginatedTasksWithIndex.length > 0 &&
              [0, 1, 2, 3].map((status) => {
                const tasksInGroup = paginatedTasksWithIndex.filter(
                  ({ task }) => task.status === status,
                );
                if (tasksInGroup.length === 0) return null;
                const groupKey = String(status);
                const isCollapsed = collapsedGroups.has(groupKey);
                return (
                  <React.Fragment key={status}>
                    <TableRow
                      className="bg-[#F3F2EF] hover:bg-[#EDEDEA] cursor-pointer transition-colors"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <TableHead
                        colSpan={totalColumns}
                        className="py-2 px-4 font-semibold text-[#6b6b6b] select-none"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-[#9a9a96]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#9a9a96]" />
                          )}
                          {TASK_STATUS_LABELS[status]} ({tasksInGroup.length})
                        </div>
                      </TableHead>
                    </TableRow>
                    {!isCollapsed &&
                      tasksInGroup.map(({ task, index }) => (
                        <TaskRow
                          key={task.id}
                          userData={userData}
                          ListTasks={filteredTasks}
                          setListTasks={setListTasks}
                          task={task}
                          index={index}
                          showIndexColumn={showIndexColumn}
                          setCheckList={(newChecks) => {
                            const taskId = filteredTasks[index].id;
                            setSelectedTasks((prev) => {
                              const next = new Set(prev);
                              if (newChecks[index]) {
                                next.add(taskId);
                              } else {
                                next.delete(taskId);
                              }
                              return next;
                            });
                          }}
                          checkList={filteredTasks.map((t) =>
                            selectedTasks.has(t.id),
                          )}
                          workspaceUsers={workspaceUsers}
                        />
                      ))}
                  </React.Fragment>
                );
              })}

            {!skeletonLoaderForTable &&
              groupBy !== null &&
              groupBy !== "status" &&
              paginatedTasksWithIndex.length > 0 &&
              (() => {
                const { fieldLabel, templateName } = groupBy as {
                  fieldLabel: string;
                  templateName: string;
                };
                const fieldDef = cfTemplates
                  .find((t) => t.name === templateName)
                  ?.fields.find((f) => f.label === fieldLabel);
                const emptyDefault =
                  fieldDef?.type === "boolean" ? "false" : "";
                const uniqueValues = [
                  ...new Set(
                    paginatedTasksWithIndex.map(
                      ({ task }) =>
                        (task as any).custom_fields?.[fieldLabel] ??
                        emptyDefault,
                    ),
                  ),
                ].sort((a, b) => {
                  if (a === "") return 1;
                  if (b === "") return -1;
                  return a.localeCompare(b);
                });
                return uniqueValues.map((value) => {
                  const tasksInGroup = paginatedTasksWithIndex.filter(
                    ({ task }) =>
                      ((task as any).custom_fields?.[fieldLabel] ??
                        emptyDefault) === value,
                  );
                  if (tasksInGroup.length === 0) return null;
                  const groupKey = `cf:${fieldLabel}:${value}`;
                  const isCollapsed = collapsedGroups.has(groupKey);
                  const displayValue = value || "—";
                  return (
                    <React.Fragment key={groupKey}>
                      <TableRow
                        className="bg-[#F3F2EF] hover:bg-[#EDEDEA] cursor-pointer transition-colors"
                        onClick={() => toggleGroup(groupKey)}
                      >
                        <TableHead
                          colSpan={totalColumns}
                          className="py-2 px-4 font-semibold text-[#6b6b6b] select-none"
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-[#9a9a96]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[#9a9a96]" />
                            )}
                            <span className="text-xs font-medium text-[#9a9a96] uppercase tracking-wider">
                              {fieldLabel}:
                            </span>
                            {displayValue} ({tasksInGroup.length})
                          </div>
                        </TableHead>
                      </TableRow>
                      {!isCollapsed &&
                        tasksInGroup.map(({ task, index }) => (
                          <TaskRow
                            key={task.id}
                            userData={userData}
                            ListTasks={filteredTasks}
                            setListTasks={setListTasks}
                            task={task}
                            index={index}
                            showIndexColumn={showIndexColumn}
                            setCheckList={(newChecks) => {
                              const taskId = filteredTasks[index].id;
                              setSelectedTasks((prev) => {
                                const next = new Set(prev);
                                if (newChecks[index]) {
                                  next.add(taskId);
                                } else {
                                  next.delete(taskId);
                                }
                                return next;
                              });
                            }}
                            checkList={filteredTasks.map((t) =>
                              selectedTasks.has(t.id),
                            )}
                            workspaceUsers={workspaceUsers}
                          />
                        ))}
                    </React.Fragment>
                  );
                });
              })()}

            {!skeletonLoaderForTable && filteredTasks.length === 0 && (
              <TableRow>
                <TableHead
                  colSpan={totalColumns}
                  className="text-center py-10 text-[#9a9a96]"
                >
                  No tasks found matching your filters
                </TableHead>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!skeletonLoaderForTable && filteredTasks.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#6b6b6b]">
          <div>
            Showing {startIndex + 1}-
            {Math.min(startIndex + PAGE_SIZE, filteredTasks.length)} of{" "}
            {filteredTasks.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-[#EDEDEA] bg-white text-[#6b6b6b] rounded-lg hover:bg-[#F3F2EF]"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-xs font-medium text-[#9a9a96]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-[#EDEDEA] bg-white text-[#6b6b6b] rounded-lg hover:bg-[#F3F2EF]"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none font-['DM_Sans']">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1a1a1a] font-semibold">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b6b6b] text-sm">
              Are you sure you want to delete {selectedTasks.size} selected
              task(s)?
              {(() => {
                const tasksToDelete = ListTasks.filter(
                  (task) =>
                    selectedTasks.has(task.id) &&
                    task.created_by_user?.id === userData?.id,
                );
                const tasksNotOwned = selectedTasks.size - tasksToDelete.length;
                return tasksNotOwned > 0
                  ? ` Note: ${tasksNotOwned} task(s) will be skipped as you can only delete tasks you created.`
                  : "";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-lg border border-[#EDEDEA] bg-white text-[#6b6b6b] text-sm hover:bg-[#F3F2EF] shadow-none"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSelected}
              disabled={isDeleting}
              className="bg-[#C0432A] hover:bg-[#A83924] text-white text-sm font-medium rounded-lg px-4 py-2 shadow-none"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewListViewComponent;
