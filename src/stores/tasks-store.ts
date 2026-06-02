import { create } from "zustand";

type TasksState = {
  tasks: any[];
  cachedAt: number | null; // ms timestamp
  setTasks: (tasks: any[]) => void;
  isStale: () => boolean;
};

const STALE_MS = 30_000; // 30 seconds

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  cachedAt: null,
  setTasks: (tasks) => set({ tasks, cachedAt: Date.now() }),
  isStale: () => {
    const { cachedAt } = get();
    if (!cachedAt) return true;
    return Date.now() - cachedAt > STALE_MS;
  },
}));
