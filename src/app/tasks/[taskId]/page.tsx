import { redirect } from "next/navigation";
import TaskInfoPage from "./taskInfoPage";

interface TaskDetailsPageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function TaskDetailsPage(props: TaskDetailsPageProps) {
  const params = await props.params;
  const { taskId } = params;

  if (!taskId) {
    redirect("/tasks");
  }

  // Check if user is authenticated
  // return <Component taskId={taskId} />;

  return <TaskInfoPage taskId={taskId} />;
}
