"use client";

import { getWorkspacePresets } from "@/apiReq/newAPIs/automation-presets";
import { startTaskAutomation } from "@/apiReq/newAPIs/task-automation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface TaskAutomationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onSuccess?: () => void;
}

export function TaskAutomationDialog({
  isOpen,
  onClose,
  taskId,
  onSuccess,
}: TaskAutomationDialogProps) {
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStartingAutomation, setIsStartingAutomation] =
    useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const loadPresets = async () => {
        setIsLoading(true);
        try {
          const { success, data } = await getWorkspacePresets();
          if (success) {
            setPresets(data);
          } else {
            toast({
              title: "Error loading presets",
              description: "Failed to load automation presets",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error loading presets:", error);
          toast({
            title: "Error loading presets",
            description: "Failed to load automation presets",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadPresets();
    }
  }, [isOpen, toast]);

  const handleStartAutomation = async () => {
    if (!selectedPreset) {
      toast({
        title: "No preset selected",
        description: "Please select an approval workflow preset",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStartingAutomation(true);
      const preset = presets.find((p) => p.id === selectedPreset);

      if (!preset) {
        throw new Error("Selected preset not found");
      }

      const formData = new FormData();
      formData.append("task_id", taskId);
      formData.append("users", JSON.stringify(preset.users));
      formData.append("use_deadlines", preset.has_deadlines.toString());

      const res = await startTaskAutomation(formData);

      if (res.success) {
        toast({
          title: "Automation started",
          description: "Approval workflow started successfully",
        });
        onClose();
        if (onSuccess) onSuccess();
        router.push(`/home/tasks/${taskId}/automation-status`);
      } else {
        throw new Error(res.message || "Failed to start automation");
      }
    } catch (error) {
      console.error("Error starting automation:", error);
      toast({
        title: "Automation failed",
        description: error.message || "Failed to start automation process",
        variant: "destructive",
      });
    } finally {
      setIsStartingAutomation(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Approval Workflow</DialogTitle>
          <DialogDescription>
            Select an approval preset to start the task review process.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="preset" className="text-sm font-medium">
              Approval Preset
            </label>
            <Select
              disabled={isLoading || presets.length === 0}
              value={selectedPreset}
              onValueChange={setSelectedPreset}
            >
              <SelectTrigger id="preset">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading presets...
                  </div>
                ) : presets.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No presets available. Create one in Settings.
                  </div>
                ) : (
                  presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleStartAutomation}
            disabled={isStartingAutomation || !selectedPreset}
          >
            {isStartingAutomation && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Start Approval Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
