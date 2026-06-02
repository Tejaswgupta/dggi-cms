import {
  getCurrentTaskAssignee,
  isDelegationWorkflowEnabled,
} from "@/apiReq/newAPIs/workspace-settings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Crown,
  GitBranch,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface TaskAssignmentStatusProps {
  taskId: string;
  onAssignmentChange?: () => void;
}

interface AssignmentData {
  assigneeId: string;
  assignmentType: "simple" | "delegation";
  assignedBy?: string;
  assigneeUser?: {
    id: string;
    name: string;
    email: string;
  };
  assignedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  delegationChain?: any;
}

const TaskAssignmentStatus: React.FC<TaskAssignmentStatusProps> = ({
  taskId,
  onAssignmentChange,
}) => {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isDelegationEnabled, setIsDelegationEnabled] = useState(false);

  useEffect(() => {
    loadAssignmentData();
  }, [taskId]);

  const loadAssignmentData = async () => {
    setLoading(true);
    try {
      // Check if delegation is enabled
      const delegationEnabled = await isDelegationWorkflowEnabled();
      setIsDelegationEnabled(delegationEnabled);

      // Get current assignment
      const result = await getCurrentTaskAssignee(taskId);
      if (result.success) {
        setAssignmentData(result.data as unknown as AssignmentData);
      }
    } catch (error) {
      console.error("Error loading assignment data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignmentData) {
    return (
      <Card className="w-full border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-4 h-4" />
            <span className="text-sm">No assignment found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {assignmentData.assignmentType === "delegation" ? (
            <>
              <GitBranch className="w-5 h-5 text-blue-600" />
              Delegation Assignment
            </>
          ) : (
            <>
              <UserCheck className="w-5 h-5 text-green-600" />
              Direct Assignment
            </>
          )}
          <Badge
            variant={
              assignmentData.assignmentType === "delegation"
                ? "default"
                : "secondary"
            }
            className="ml-auto"
          >
            {assignmentData.assignmentType === "delegation"
              ? "Delegated"
              : "Simple"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {assignmentData.assignmentType === "delegation" ? (
          <DelegationAssignmentView data={assignmentData} />
        ) : (
          <SimpleAssignmentView data={assignmentData} />
        )}

        {/* Workspace Status */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>Workspace Mode:</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {isDelegationEnabled ? "Delegation Enabled" : "Simple Assignment"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SimpleAssignmentView: React.FC<{ data: AssignmentData }> = ({ data }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <User className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">
          {data.assigneeUser?.name || "Unknown User"}
        </p>
        <p className="text-xs text-gray-500">{data.assigneeUser?.email}</p>
      </div>
    </div>

    {data.assignedByUser && (
      <div className="flex items-center gap-2 text-xs text-gray-500 ml-11">
        <span>Assigned by</span>
        <ArrowRight className="w-3 h-3" />
        <span className="font-medium">{data.assignedByUser.name}</span>
      </div>
    )}

    <div className="bg-green-50 rounded-lg p-3 ml-11">
      <p className="text-xs text-green-700">
        ✅ Direct assignment - Task is assigned directly to this user
      </p>
    </div>
  </div>
);

const DelegationAssignmentView: React.FC<{ data: AssignmentData }> = ({
  data,
}) => {
  const chain = data.delegationChain;
  const currentStep = chain?.delegation_steps?.find(
    (step: any) =>
      step.delegated_to === data.assigneeId && step.status === "pending"
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Current Assignee</p>
          <p className="text-xs text-gray-500">
            Step {currentStep?.step_order || "?"} in delegation chain
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {chain?.status || "Active"}
        </Badge>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 ml-11">
        <div className="flex items-center gap-2 text-xs text-blue-700 mb-2">
          <GitBranch className="w-3 h-3" />
          <span className="font-medium">Delegation Chain Active</span>
        </div>
        <p className="text-xs text-blue-600">
          This task is part of a {chain?.delegation_steps?.length || 0}-step
          delegation workflow.
          {currentStep && (
            <span className="block mt-1">
              Current step: {currentStep.notes || "No notes provided"}
            </span>
          )}
        </p>
      </div>

      {/* Mini delegation timeline */}
      {chain?.delegation_steps && chain.delegation_steps.length > 0 && (
        <div className="ml-11 border-l-2 border-blue-200 pl-3">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Chain Summary:
          </p>
          {chain.delegation_steps
            .sort((a: any, b: any) => a.step_order - b.step_order)
            .slice(0, 3)
            .map((step: any, index: number) => (
              <div
                key={step.id}
                className="flex items-center gap-2 text-xs text-gray-600 mb-1"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    step.status === "completed"
                      ? "bg-green-400"
                      : step.status === "pending"
                        ? "bg-blue-400"
                        : "bg-gray-300"
                  }`}
                />
                <span>Step {step.step_order}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="truncate max-w-[100px]">
                  {step.delegated_to_user?.name || "User"}
                </span>
              </div>
            ))}
          {chain.delegation_steps.length > 3 && (
            <p className="text-xs text-gray-400">
              +{chain.delegation_steps.length - 3} more steps...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskAssignmentStatus;
