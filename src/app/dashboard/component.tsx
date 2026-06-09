"use client";
import { getTodaySession, getUpcomingCases } from "@/apiReq/newAPIs/Dash";
import checkUserAuthClient from "@/auth/getUserSession";
import CaseViewer from "@/components/homeComponent/dashboard/caseViewer";
import TaskViewer from "@/components/homeComponent/dashboard/taskViewer";
import SessionNotFoundComp from "@/components/sessionNotFound";
import { Button } from "@/components/ui/button";

import { getUserDetailById } from "@/apiReq/newAPIs/roadmaps";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initializeAuthListener } from "@/utils/authManager";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle,
  Clock,
  Gavel,
  Hash,
  Plus,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "./skeleton";

const Component = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<any>();
  const [load, setLoad] = useState<boolean>(true);
  const [tasks, setTask] = useState<any>([]);
  const [cases, setCases] = useState<any>([]);
  const [sessionNotFound, setSessionNotFound] = useState<boolean>(false);

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const cleanupAuthListener = initializeAuthListener();
    return () => {
      cleanupAuthListener();
    };
  }, []);

  useEffect(() => {
    getUserDetail();
    const cardContent = document.querySelector(".card-content");
  }, []);

  const getUserDetail = useCallback(async () => {
    try {
      setLoad(true);
      const res: any = await checkUserAuthClient();
      if (res.error !== null) {
        router.push("/");
        return;
      }

      if (res.data?.session === null) {
        setLoad(false);
        setSessionNotFound(true);
        return;
      }

      const metadata = res.data.session.user.user_metadata;
      const userId = res.data.session.user.id;
      // Fetch name from votum_users table
      if (userId) {
        const dbUser = await getUserDetailById(userId);
        if (dbUser && dbUser.name) {
          setUserName(dbUser.name);
        }
      }
      const result = await getTodaySession(userId, metadata.workspace_id);

      if (result.success === true) {
        setTask(result.tasks || []);
      } else {
        console.error("Failed to fetch session data:", result.error);
        setTask([]);
      }

      const casesResult = await getUpcomingCases(userId, metadata.workspace_id);

      if (casesResult.success === true) {
        setCases(casesResult.cases || []);
      } else {
        console.error("Failed to fetch cases data:", casesResult.error);
        setCases([]);
      }

      setUserData({ id: userId, ...metadata });
      setLoad(false);
    } catch (e) {
      console.error("Error in getUserDetail:", e);
      setLoad(false);
      setTask([]);
    }
  }, [router]);

  const getGreeting = useCallback(() => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    let greeting;

    if (currentHour < 12) {
      greeting = "Good morning";
    } else if (currentHour < 18) {
      greeting = "Good morning";
    } else {
      greeting = "Good evening";
    }

    return greeting;
  }, []);

  const isOverdue = useCallback((date: string): boolean => {
    if (!date) return false;
    const taskDate = new Date(date);
    const currentDate = new Date();
    return taskDate.toLocaleDateString() < currentDate.toLocaleDateString();
  }, []);

  const getTaskUserId = useCallback(
    (task: any, field: "assigned_to" | "created_by") => {
      const value = task?.[field];
      if (!value) return null;
      if (typeof value === "string") return value;
      if (typeof value === "object" && "id" in value) return value.id;
      return null;
    },
    [],
  );

  const assignedTasks = useMemo(() => {
    if (!userData?.id) return [];
    return tasks.filter(
      (task: any) => getTaskUserId(task, "assigned_to") === userData.id,
    );
  }, [tasks, userData?.id, getTaskUserId]);

  const createdTasks = useMemo(() => {
    if (!userData?.id) return [];
    return tasks.filter(
      (task: any) => getTaskUserId(task, "created_by") === userData.id,
    );
  }, [tasks, userData?.id, getTaskUserId]);

  const renderTasks = useCallback(
    (taskList: any[], status: number) => {
      if (!taskList || taskList.length === 0) return [];
      return taskList
        .filter((task) =>
          status === -1
            ? isOverdue(task.dueDate) && task.status !== 2
            : task.status === status || task.status === status + 1,
        )
        .map((task: any, idx: number) => (
          <TaskViewer task={task} key={idx} setTask={setTask} />
        ));
    },
    [isOverdue],
  );

  const getTaskCount = useCallback(
    (taskList: any[], status: string): number => {
      if (!taskList || taskList.length === 0) return 0;

      return taskList.filter((task) => {
        if (!task) return false;

        if (status === "upcoming") return task.status === 0;
        if (status === "overdue")
          return isOverdue(task.dueDate) && task.status !== 2; // completed
        return task.status === 2 || task.status === 3;
      }).length;
    },
    [isOverdue],
  );

  const todayHearings = useMemo(() => {
    if (!cases || cases.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cases.filter((c: any) => {
      if (!c.next_listing_date) return false;
      const d = new Date(c.next_listing_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  }, [cases]);

  const hearingsThisWeek = useMemo(() => {
    if (!cases || cases.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cases.filter((c: any) => {
      if (!c.next_listing_date) return false;
      const d = new Date(c.next_listing_date);
      d.setHours(0, 0, 0, 0);
      const diff = Math.ceil(
        (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diff >= 0 && diff <= 7;
    }).length;
  }, [cases]);

  const pendingTasksCount = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    return tasks.filter((t: any) => t && t.status !== 2 && t.status !== 3)
      .length;
  }, [tasks]);

  const overdueItemsCount = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    return tasks.filter((t: any) => t && isOverdue(t.dueDate) && t.status !== 2)
      .length;
  }, [tasks, isOverdue]);

  if (sessionNotFound === true) {
    return <SessionNotFoundComp />;
  }

  if (load) {
    return <Skeleton />;
  }

  return (
    <>
      <main className="w-full h-full items-center overflow-y-auto flex flex-1 flex-col gap-6 p-4 md:p-6 bg-white">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-[28px] font-normal text-gray-900 [font-family:var(--font-dm-serif)]">{`${getGreeting()}, ${
                userName || (userData ? userData.name : "User")
              }`}</h1>
              <p className="text-[13px] text-[#9a9a96] mt-1">
                Today •{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button
                asChild
                size="sm"
                variant="default"
                className="flex items-center gap-1 bg-[#4A5FD4] hover:bg-[#3B4EC5] rounded-[8px] px-[18px] py-[9px] text-[13.5px] font-medium border-0"
              >
                <Link href="/tasks">
                  <Plus size={16} />
                  New Task
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[65fr_35fr]">
            {/* Left column */}
            <div className="grid gap-6 content-start">
              <Card className="w-full min-w-0 shadow-none border border-[#EDEDEA] hover:border-[#DEDBD5] bg-white rounded-[14px] transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl">My Tasks</CardTitle>
                    <CardDescription>
                      Tasks assigned to or created by you
                    </CardDescription>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-indigo-700 border-indigo-100 hover:bg-indigo-50"
                  >
                    <Link href="/tasks">
                      View All
                      <ArrowUpRight size={14} />
                    </Link>
                  </Button>
                </CardHeader>

                <CardContent className="pt-4">
                  <Tabs defaultValue="assigned" className="w-full">
                    <TabsList className="w-full flex mb-4 bg-[#F3F2EF] rounded-[8px] p-[3px]">
                      <TabsTrigger
                        value="assigned"
                        className="flex-1 text-[#7a7a76] data-[state=active]:bg-white data-[state=active]:rounded-[6px] data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:text-gray-900"
                      >
                        Assigned to Me
                      </TabsTrigger>
                      <TabsTrigger
                        value="created"
                        className="flex-1 text-[#7a7a76] data-[state=active]:bg-white data-[state=active]:rounded-[6px] data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:text-gray-900"
                      >
                        Created by Me
                      </TabsTrigger>
                    </TabsList>

                    {(["assigned", "created"] as const).map((view) => {
                      const taskList =
                        view === "assigned" ? assignedTasks : createdTasks;
                      return (
                        <TabsContent key={view} value={view}>
                          <Tabs defaultValue="Upcoming" className="w-full">
                            <TabsList className="w-full flex mb-4 bg-[#F3F2EF] rounded-[8px] p-[3px]">
                              <TabsTrigger
                                value="Upcoming"
                                className="flex-1 text-[#7a7a76] data-[state=active]:bg-white data-[state=active]:rounded-[6px] data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:text-gray-900"
                              >
                                Upcoming ({getTaskCount(taskList, "upcoming")})
                              </TabsTrigger>
                              <TabsTrigger
                                value="Overdue"
                                className="flex-1 text-[#7a7a76] data-[state=active]:bg-white data-[state=active]:rounded-[6px] data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:text-gray-900"
                              >
                                Overdue ({getTaskCount(taskList, "overdue")})
                              </TabsTrigger>
                              <TabsTrigger
                                value="Complete"
                                className="flex-1 text-[#7a7a76] data-[state=active]:bg-white data-[state=active]:rounded-[6px] data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:text-gray-900"
                              >
                                Completed ({getTaskCount(taskList, "completed")}
                                )
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent
                              value="Upcoming"
                              className="max-h-[400px] overflow-y-auto"
                            >
                              {renderTasks(taskList, 0).length ? (
                                renderTasks(taskList, 0)
                              ) : (
                                <div className="py-8 flex flex-col items-center gap-2">
                                  <div className="w-11 h-11 rounded-full bg-[#F3F2EF] flex items-center justify-center">
                                    <CheckCircle
                                      size={20}
                                      className="text-[#9a9a96]"
                                    />
                                  </div>
                                  <p className="text-[#7a7a76] text-sm">
                                    You&apos;re all caught up!
                                  </p>
                                  <Link
                                    href="/tasks"
                                    className="text-[#4A5FD4] text-xs mt-1"
                                  >
                                    + Assign yourself a task
                                  </Link>
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent
                              value="Overdue"
                              className="max-h-[400px] overflow-y-auto"
                            >
                              {renderTasks(taskList, -1).length ? (
                                renderTasks(taskList, -1)
                              ) : (
                                <div className="py-8 flex flex-col items-center gap-2">
                                  <div className="w-11 h-11 rounded-full bg-[#F3F2EF] flex items-center justify-center">
                                    <CheckCircle
                                      size={20}
                                      className="text-[#9a9a96]"
                                    />
                                  </div>
                                  <p className="text-[#7a7a76] text-sm">
                                    You&apos;re all caught up!
                                  </p>
                                  <Link
                                    href="/tasks"
                                    className="text-[#4A5FD4] text-xs mt-1"
                                  >
                                    + Assign yourself a task
                                  </Link>
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent
                              value="Complete"
                              className="max-h-[400px] overflow-y-auto"
                            >
                              {renderTasks(taskList, 2).length ? (
                                renderTasks(taskList, 2)
                              ) : (
                                <div className="py-8 flex flex-col items-center gap-2">
                                  <div className="w-11 h-11 rounded-full bg-[#F3F2EF] flex items-center justify-center">
                                    <CheckCircle
                                      size={20}
                                      className="text-[#9a9a96]"
                                    />
                                  </div>
                                  <p className="text-[#7a7a76] text-sm">
                                    Nothing completed yet.
                                  </p>
                                  <Link
                                    href="/tasks"
                                    className="text-[#4A5FD4] text-xs mt-1"
                                  >
                                    + Assign yourself a task
                                  </Link>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="w-full min-w-0 shadow-none border border-[#EDEDEA] hover:border-[#DEDBD5] bg-white rounded-[14px] transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl">Upcoming Cases</CardTitle>
                    <CardDescription>Your next hearing dates</CardDescription>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-indigo-700 border-indigo-100 hover:bg-indigo-50"
                  >
                    <Link href="/cases">
                      View All
                      <ArrowUpRight size={14} />
                    </Link>
                  </Button>
                </CardHeader>

                <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
                  {cases && cases.length > 0 ? (
                    cases.map((caseItem: any, idx: number) => (
                      <CaseViewer key={idx} case={caseItem} />
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <Gavel size={32} className="mx-auto mb-3 text-gray-300" />
                      <p>No upcoming cases</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t flex justify-center">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href="/cases">
                      <Plus size={16} className="mr-2" />
                      New Case
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right column */}
            <div className="grid gap-6 content-start">
              {/* Today's Hearings */}
              <Card className="w-full min-w-0 shadow-none border border-[#EDEDEA] hover:border-[#DEDBD5] bg-white rounded-[14px] transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl">
                      Today&apos;s Hearings
                    </CardTitle>
                    <CardDescription>Cases listed for today</CardDescription>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Calendar size={15} className="text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4 max-h-[360px] overflow-y-auto">
                  {todayHearings.length > 0 ? (
                    todayHearings.map((caseItem: any, idx: number) => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const clEntry = Array.isArray(caseItem.cause_list_entries)
                        ? caseItem.cause_list_entries.find((e: any) =>
                            e?.listing_date?.startsWith(todayStr),
                          )
                        : null;
                      const itemNo = clEntry?.item_no ?? null;
                      const courtName =
                        clEntry?.court_name ||
                        caseItem?.court_display?.court_name ||
                        caseItem?.court_code ||
                        null;
                      const vcLink =
                        clEntry?.vc_link ||
                        clEntry?.metadata?.raw?.vc_link ||
                        clEntry?.metadata?.vc_link ||
                        null;
                      const formatPartyName = (party?: string[] | null) => {
                        const name = Array.isArray(party)
                          ? party.filter(Boolean).join(", ")
                          : "";
                        return name.trim() || "Unknown";
                      };
                      const caseNameFull = `${formatPartyName(caseItem.petitioner)} vs ${formatPartyName(caseItem.respondent)}`;
                      const caseNumber = caseItem.registration_no || "N/A";
                      return (
                        <div
                          key={idx}
                          className="border-b border-[#F3F2EF] last:border-b-0"
                        >
                          <div
                            className="flex gap-3 items-start hover:bg-[#FAFAF8] rounded-[8px] p-3 transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(`/cases/${caseItem.id}`)
                            }
                          >
                            <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h2 className="text-[13.5px] font-semibold text-gray-900 truncate leading-snug">
                                {caseNameFull}
                              </h2>
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                {caseNumber}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                {itemNo && (
                                  <span className="flex items-center gap-1 text-[11px] text-[#6b6b6b]">
                                    <Hash size={10} className="flex-shrink-0" />
                                    Item {itemNo}
                                  </span>
                                )}
                                {courtName && (
                                  <span
                                    className="text-[11px] text-[#b0b0aa] truncate max-w-[140px]"
                                    title={courtName}
                                  >
                                    {courtName}
                                  </span>
                                )}
                                {vcLink && (
                                  <a
                                    href={vcLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-[11px] text-[#4A5FD4] hover:underline"
                                  >
                                    <Video
                                      size={10}
                                      className="flex-shrink-0"
                                    />
                                    Join VC
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <Calendar
                        size={28}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p className="text-sm">No hearings today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metrics 2×2 */}
              <Card className="w-full min-w-0 shadow-none border border-[#EDEDEA] hover:border-[#DEDBD5] bg-white rounded-[14px] transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Overview</CardTitle>
                  <CardDescription>
                    Your current workload at a glance
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[10px] border border-[#EDEDEA] bg-[#FAFAF8] p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#9a9a96]">
                        <BarChart2 size={13} />
                        <span className="text-[11px] font-medium uppercase tracking-wide">
                          Total Cases
                        </span>
                      </div>
                      <span className="text-[28px] font-semibold text-gray-900 leading-tight">
                        {cases.length}
                      </span>
                    </div>

                    <div className="rounded-[10px] border border-[#EDEDEA] bg-[#FAFAF8] p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#9a9a96]">
                        <Calendar size={13} />
                        <span className="text-[11px] font-medium uppercase tracking-wide">
                          This Week
                        </span>
                      </div>
                      <span className="text-[28px] font-semibold text-gray-900 leading-tight">
                        {hearingsThisWeek}
                      </span>
                      <span className="text-[10px] text-[#9a9a96]">
                        Hearings
                      </span>
                    </div>

                    <div className="rounded-[10px] border border-[#EDEDEA] bg-[#FAFAF8] p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#9a9a96]">
                        <Clock size={13} />
                        <span className="text-[11px] font-medium uppercase tracking-wide">
                          Pending Tasks
                        </span>
                      </div>
                      <span className="text-[28px] font-semibold text-gray-900 leading-tight">
                        {pendingTasksCount}
                      </span>
                    </div>

                    <div className="rounded-[10px] border border-[#EDEDEA] bg-[#FAFAF8] p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#9a9a96]">
                        <AlertCircle size={13} />
                        <span className="text-[11px] font-medium uppercase tracking-wide">
                          Overdue
                        </span>
                      </div>
                      <span
                        className={`text-[28px] font-semibold leading-tight ${overdueItemsCount > 0 ? "text-rose-600" : "text-gray-900"}`}
                      >
                        {overdueItemsCount}
                      </span>
                      <span className="text-[10px] text-[#9a9a96]">Items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Component;
