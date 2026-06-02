import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

interface SuggestedTasksViewProps {
  suggestedTasks: any[];
  isLoading: boolean;
  setSuggestedTasks: (tasks: any[]) => void;
}

const SuggestedTasksView = ({
  suggestedTasks,
  isLoading,
  setSuggestedTasks,
}: SuggestedTasksViewProps) => {
  const { toast } = useToast();

  const handleCreateFromSuggestion = async (
    title: string,
    description: string,
    taskId: string
  ) => {
    // Generate a unique id for the new task to avoid duplicate key errors

    setSuggestedTasks([
      ...suggestedTasks,
      {
        task_details: {
          task_title: title,
          task_content: description,
        },
      },
    ]);

    const createNewtaskAlert: any = document.querySelector(
      ".createNewTaskButtonTaskSection"
    );
    if (createNewtaskAlert) {
      createNewtaskAlert.click();
    }
  };

  const handleDeleteSuggestedTask = async (taskId: string) => {
    try {
      const supabase = clientConnectionWithSupabase();
      const { error } = await supabase
        .from("votum_suggested_tasks")
        .delete()
        .eq("id", String(taskId));

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting suggested task:", error);
      return { success: false, error: error.message };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (suggestedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h3 className="text-lg font-semibold">No suggested tasks</h3>
        <p className="text-sm text-gray-500">
          Suggestions will appear here when available
        </p>
      </div>
    );
  }

  console.log(suggestedTasks);

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-[250px] w-[20%]">Task</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="max-w-[200px] w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestedTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                {task?.task_details?.task_title}
              </TableCell>
              <TableCell className="max-w-md">
                <div className="line-clamp-2 text-sm text-gray-600">
                  {task?.task_details?.task_content}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleCreateFromSuggestion(
                        task?.task_details?.task_title,
                        task?.task_details?.task_content,
                        task.id
                      )
                    }
                  >
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const result = await handleDeleteSuggestedTask(task.id);
                      if (result.success) {
                        setSuggestedTasks(
                          suggestedTasks.filter((t) => t.id !== task.id)
                        );
                        toast({
                          title: "Task deleted",
                          description: "The suggested task has been removed",
                        });
                      } else {
                        toast({
                          title: "Error",
                          description: "Failed to delete the suggested task",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SuggestedTasksView;
