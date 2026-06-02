type Priority = "Low" | "Medium" | "High";

interface ContentBlock {
  id: string;
  type: string;
  props: {
    textColor: string;
    backgroundColor: string;
    textAlignment: string;
  };
  content: Array<{ text?: string }>;
  children: any[];
}

export type TaskSource = "email" | "manual" | "whatsapp";

export interface Task {
  id: string;
  name: string;
  taskContent?: string; // JSON string of ContentBlock[]
  dueDate: string | null;
  status: 0 | 1 | 2 | 3; // 0: TO DO, 1: IN PROGRESS, 2: IN VERIFY, 3: DONE
  priority: Priority;
  workspace_id: string;
  moved_to_done_at: string | null;
  assigned_to: { id: string; name: string } | null;
  cc_users?: { id: string; name: string }[]; // New CC field
  last_updated_by: { id: string; name: string } | null;
  created_by_user: { id: string; name: string } | null; // Original creator of the task
  case_id?: string;
  source?: TaskSource | null;
}

type SortOrder = "asc" | "desc" | "";
export type SortField =
  | "title"
  | "status"
  | "priority"
  | "dueDate"
  | "description"
  | "assignee"
  | "creator"
  | "team"
  | "client"
  | "serialNumber"
  | "source";

export interface SortState {
  field: SortField | null;
  order: SortOrder;
}

export const PRIORITY_ORDER = {
  asc: ["Low", "Medium", "High"] as Priority[],
  desc: ["High", "Medium", "Low"] as Priority[],
} as const;

export const STATUS_ORDER = {
  0: 0, // TO DO
  1: 1, // IN PROGRESS
  2: 2, // IN VERIFY
  3: 3, // DONE
} as const;

export interface TaskRowProps {
  ListTasks: Task[];
  setListTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  task: Task;
  index: number;
  showIndexColumn?: boolean;
  setCheckList: (checks: boolean[]) => void;
  checkList: boolean[];
  userData: any; // TODO: Define proper type
  workspaceUsers: { id: string; name: string }[];
}

export interface ListViewProps {
  ListTasks: Task[];
  setListTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSkeletonLoaderForTable: (loading: boolean) => void;
  skeletonLoaderForTable: boolean;
  userData: any; // TODO: Define proper type for userData
  onSelectionChange?: (selectedTasks: Set<string>) => void;
  selectionResetKey?: number;
  showIndexColumn?: boolean;
}
import type React from "react";
