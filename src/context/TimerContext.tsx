"use client";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import createSupabaseServerClient from "@/lib/supabase/server";
import React, { createContext, useContext, useEffect, useState } from "react";

type TimerState = {
  isRunning: boolean;
  taskId: string | null;
  startTime: string | null;
  description: string;
};

type TimerContextType = {
  isTimerRunning: boolean;
  currentTaskId: string | null;
  timerStartTime: Date | null;
  timerElapsed: number;
  timerDescription: string;
  startTimer: (taskId: string, description?: string) => void;
  stopTimer: () => Promise<any>;
  updateDescription: (description: string) => void;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    // Load from localStorage on initial render
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("votum_timer_state");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing timer state from localStorage", e);
        }
      }
    }
    return { isRunning: false, taskId: null, startTime: null, description: "" };
  });

  const [timerElapsed, setTimerElapsed] = useState<number>(0);

  // Calculate initial elapsed time if timer was already running
  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      const startTime = new Date(timerState.startTime);
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );
      setTimerElapsed(elapsed);
    }
  }, [timerState.isRunning, timerState.startTime]);

  // Set up interval for timer when running
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (timerState.isRunning && timerState.startTime) {
      const startTime = new Date(timerState.startTime);

      intervalId = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000
        );
        setTimerElapsed(elapsed);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState.isRunning, timerState.startTime]);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("votum_timer_state", JSON.stringify(timerState));
    }
  }, [timerState]);

  const startTimer = (taskId: string, description: string = "") => {
    console.log("Starting timer for task:", taskId);
    console.log("Description:", description);

    const startTime = new Date();
    setTimerState({
      isRunning: true,
      taskId,
      startTime: startTime.toISOString(),
      description,
    });
    setTimerElapsed(0);

    // Log to verify the timer was started
    console.log("Timer started successfully");
  };

  const stopTimer = async () => {
    console.log("Attempting to stop timer");

    if (!timerState.isRunning || !timerState.taskId || !timerState.startTime) {
      console.log("No timer running, cannot stop");
      return { success: false, error: "No timer running" };
    }

    try {
      const { getTaskData } = await import("@/apiReq/newAPIs/task-new");
      const { addTimeEntry } = await import("@/apiReq/newAPIs/time-tracking");
      const supabase = clientConnectionWithSupabase();

      // Get the current user from Supabase
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = sessionData.session.user.id;

      // Fetch task data
      const taskData = await getTaskData(timerState.taskId);

      if (taskData.error || !taskData.data) {
        throw new Error(taskData.error || "Failed to get task data");
      }

      // Prepare time entry payload
      const timeEntryData = {
        task_id: timerState.taskId,
        user_id: userId,
        description: timerState.description || "Work on task",
        duration: timerElapsed,
        date: new Date().toISOString().split("T")[0],
        client_id: taskData.data.client_id || null,
        workspace_id: taskData.data.workspace_id,
      };

      const result = await addTimeEntry(timeEntryData);

      if (!result.success) {
        throw new Error(result.error || "Failed to save time entry");
      }

      // Reset timer state
      setTimerState({
        isRunning: false,
        taskId: null,
        startTime: null,
        description: "",
      });
      setTimerElapsed(0);

      return result;
    } catch (error) {
      console.error("Error saving time entry:", error);
      return {
        success: false,
        error: error.message || "Failed to save time entry",
      };
    }
  };

  const updateDescription = (description: string) => {
    setTimerState((prev) => ({ ...prev, description }));
  };

  const timerStartTime = timerState.startTime
    ? new Date(timerState.startTime)
    : null;

  const value = {
    isTimerRunning: timerState.isRunning,
    currentTaskId: timerState.taskId,
    timerStartTime,
    timerElapsed,
    timerDescription: timerState.description,
    startTimer,
    stopTimer,
    updateDescription,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
