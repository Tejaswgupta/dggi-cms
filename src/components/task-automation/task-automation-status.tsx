"use client";

import {
  cancelTaskAutomation,
  getTaskAutomationStatus,
} from "@/apiReq/newAPIs/task-automation";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

interface TaskAutomationStatusProps {
  taskId: string;
}

export function TaskAutomationStatus({ taskId }: TaskAutomationStatusProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadAutomationStatus();
  }, [taskId]);

  const loadAutomationStatus = async () => {
    setIsLoading(true);
    try {
      const { success, data, error } = await getTaskAutomationStatus(taskId);
      if (success && data) {
        setWorkflows(data);
      } else {
        toast({
          title: "Error loading automation status",
          description: error || "Failed to load automation status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading automation status:", error);
      toast({
        title: "Error loading automation status",
        description: "Failed to load automation status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAutomation = async (workflowId: string) => {
    try {
      setIsCancelling(true);
      const { success, error } = await cancelTaskAutomation(workflowId);
      if (success) {
        toast({
          title: "Automation cancelled",
          description: "The approval workflow has been cancelled",
        });
        loadAutomationStatus();
      } else {
        throw new Error(error || "Failed to cancel automation");
      }
    } catch (error) {
      console.error("Error cancelling automation:", error);
      toast({
        title: "Error cancelling automation",
        description: error.message || "Failed to cancel automation",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStepStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Approved</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-amber-500 mr-2" />
            <span>Pending</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-2" />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
            <span>Not assigned</span>
          </div>
        );
    }
  };

  const getWorkflowStatus = (workflow: any) => {
    const allSteps = workflow.steps || [];
    const allApproved = allSteps.every(
      (step) => step.signer_status.toLowerCase() === "approved"
    );
    const hasRejected = allSteps.some(
      (step) => step.signer_status.toLowerCase() === "rejected"
    );

    if (workflow.status === "cancelled") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Cancelled
        </Badge>
      );
    } else if (allApproved) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Completed
        </Badge>
      );
    } else if (hasRejected) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Rejected
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800">
          In Progress
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No automation workflows</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This task does not have any approval workflows yet.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/tasks/${taskId}`)}
        >
          Go back to task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Approval Workflows</h2>
        <Button
          variant="outline"
          onClick={() => router.push(`/tasks/${taskId}`)}
        >
          Back to Task
        </Button>
      </div>

      {workflows.map((workflow) => (
        <Card key={workflow.id} className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Approval Workflow v{workflow.version_number || 1}
                </CardTitle>
                <CardDescription>
                  Created{" "}
                  {workflow.created_at
                    ? formatDistanceToNow(new Date(workflow.created_at), {
                        addSuffix: true,
                      })
                    : "recently"}
                </CardDescription>
              </div>
              <div>{getWorkflowStatus(workflow)}</div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(workflow.steps || []).map((step, index) => (
                  <TableRow key={step.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{step.signer_name}</TableCell>
                    <TableCell>{getStepStatus(step.signer_status)}</TableCell>
                    <TableCell>
                      {step.deadline_date
                        ? new Date(step.deadline_date).toLocaleDateString()
                        : "No deadline"}
                    </TableCell>
                    <TableCell>
                      {step.signed_on
                        ? new Date(step.signed_on).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end">
            {workflow.status !== "cancelled" &&
              (workflow.steps?.every((s) => s.signer_status !== "approved") ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isCancelling}>
                      {isCancelling && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Cancel Workflow
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Cancel approval workflow?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel the current approval workflow. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep workflow</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelAutomation(workflow.id)}
                      >
                        Yes, cancel workflow
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null)}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
