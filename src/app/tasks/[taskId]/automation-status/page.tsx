import { TaskAutomationStatus } from "@/components/task-automation/task-automation-status";
import createSupabaseServerComponentClient from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface TaskAutomationStatusPageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function TaskAutomationStatusPage({
  params,
}: TaskAutomationStatusPageProps) {
  const resolvedParams = await params;
  const taskId = resolvedParams.taskId;

  if (!taskId) {
    redirect("/tasks");
  }

  const supabase = await createSupabaseServerComponentClient();

  // Get User details
  const userDataRes = await supabase.auth.getUser();
  if (userDataRes.error) {
    redirect("/auth/signin");
  }

  const user = userDataRes.data.user;
  if (!user) {
    redirect("/auth/signin");
  }

  // Get workspace id
  const workspaceRes = await supabase
    .from("votum_users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (workspaceRes.error) {
    redirect("/auth/signin");
  }

  const workspace_id = workspaceRes.data.workspace_id;
  if (!workspace_id) {
    redirect("/auth/signin");
  }

  // Check if task exists and user has access to it
  const taskRes = await supabase
    .from("votum_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("workspace_id", workspace_id)
    .single();

  if (taskRes.error || !taskRes.data) {
    redirect("/tasks");
  }

  return (
    <div className="container mx-auto py-8">
      <TaskAutomationStatus taskId={taskId} />
    </div>
  );
}
