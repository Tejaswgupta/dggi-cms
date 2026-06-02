"use client";

import { Button } from "@/components/ui/button";
import { useModalStore } from "@/providers/modal-store-provider";
import {
  AlertCircle,
  AlertTriangle,
  CalendarIcon,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  FileText,
  FileUp,
  FlagIcon,
  Loader2,
  Plus,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect } from "react";

import { extractTasksFromText } from "@/apiReq/extract-task-from-text";
import { extractTextFromImage } from "@/apiReq/extract-text-from-image";
import { extractTextFromScannedPdf } from "@/apiReq/extract-text-from-scanned-pdf";
import { addTaskDocuments } from "@/apiReq/newAPIs/task-new";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useDropzone } from "react-dropzone";

type SuggestedTask = {
  title: string;
  description: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  id: string;
  isEditing?: boolean;
  source?: "email" | "document" | "pst";
  emailContext?: {
    subject: string;
    sender: string;
    emailIndex: number;
    attachments: { name: string; index: string; downloadUrl: string }[];
  };
  creationStatus?: "pending" | "creating" | "success" | "failed";
  errorMessage?: string;
};

type ProcessStep =
  | "idle"
  | "analyzing"
  | "identifying"
  | "reviewing"
  | "creating";

type ProcessingType = "scanned" | "camera" | "pst" | null;

type NewTaskFromDocumentProps = {
  refreshTasks?: () => Promise<void>;
  buttonClassName?: string;
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "link";
};

function NewTaskFromDocument({
  refreshTasks,
  buttonClassName,
  buttonVariant = "outline",
}: NewTaskFromDocumentProps) {
  const { onOpen } = useModalStore((s) => s);
  const [isLoading, setIsLoading] = React.useState(false);
  const [processStep, setProcessStep] = React.useState<ProcessStep>("idle");
  const [processingStep, setProcessingStep] = React.useState<string | null>(
    null
  );
  const [processingProgress, setProcessingProgress] = React.useState(0);
  const [suggestedTasks, setSuggestedTasks] = React.useState<SuggestedTask[]>(
    []
  );
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
  const [showTaskConfirmation, setShowTaskConfirmation] = React.useState(false);
  const [lastProcessedDocument, setLastProcessedDocument] =
    React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [documentName, setDocumentName] = React.useState<string>("");
  const [originalDocument, setOriginalDocument] = React.useState<File | null>(
    null
  );

  const [extractedTextData, setExtractedTextData] = React.useState<
    string | null
  >(null);
  const [taskCreationResults, setTaskCreationResults] = React.useState<{
    successful: number;
    failed: number;
    inProgress: boolean;
  }>({ successful: 0, failed: 0, inProgress: false });

  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<ProcessingType>(null);
  const [file, setFile] = React.useState<any>(null);
  const [shouldOpenCamera, setShouldOpenCamera] = React.useState(false);

  const [pollingStatus, setPollingStatus] = React.useState<{
    status: string;
    jobId: string;
    progress?: {
      current_email: number;
      total_emails: number;
      current_folder: string;
    };
  } | null>(null);

  const { toast } = useToast();

  const handleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    const filteredTasks = getFilteredTasks();
    setSelectedTaskIds((prev) => {
      const filtered = filteredTasks.map((task) => task.id);
      const alreadySelected = filtered.every((id) => prev.includes(id));

      if (alreadySelected) {
        // If all filtered tasks are already selected, deselect them
        return prev.filter((id) => !filtered.includes(id));
      } else {
        // Otherwise, select all filtered tasks
        const newSelected = [...prev];
        filtered.forEach((id) => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      }
    });
  };

  const deselectAllTasks = () => {
    setSelectedTaskIds([]);
  };

  const startTaskEditing = (taskId: string) => {
    setSuggestedTasks((prev) =>
      prev.map((task) => ({
        ...task,
        isEditing: task.id === taskId ? true : task.isEditing,
      }))
    );
  };

  const saveTaskEdit = (
    taskId: string,
    updatedTask: Partial<SuggestedTask>
  ) => {
    setSuggestedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updatedTask, isEditing: false }
          : task
      )
    );
  };

  const cancelTaskEdit = (taskId: string) => {
    setSuggestedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, isEditing: false } : task
      )
    );
  };

  const resetState = () => {
    setSuggestedTasks([]);
    setSelectedTaskIds([]);
    setShowTaskConfirmation(false);
    setProcessStep("idle");
    setActiveTab("all");
    setDocumentName("");
    setOriginalDocument(null);

    setExtractedTextData(null);
    setPollingStatus(null);
    setTaskCreationResults({ successful: 0, failed: 0, inProgress: false });
  };

  const retryFailedTasks = async () => {
    const failedTasks = suggestedTasks.filter(
      (task) => task.creationStatus === "failed"
    );
    if (failedTasks.length === 0) return;

    // Reset failed tasks status and retry
    setSuggestedTasks((prev) =>
      prev.map((task) =>
        task.creationStatus === "failed"
          ? { ...task, creationStatus: "pending", errorMessage: undefined }
          : task
      )
    );

    // Set selected tasks to only failed ones for retry
    setSelectedTaskIds(failedTasks.map((task) => task.id));

    // Trigger creation again
    await createSelectedTasks();
  };

  const getFilteredTasks = () => {
    if (activeTab === "all") return suggestedTasks;
    if (activeTab === "high")
      return suggestedTasks.filter((task) => task.priority === "high");
    if (activeTab === "medium")
      return suggestedTasks.filter((task) => task.priority === "medium");
    if (activeTab === "low")
      return suggestedTasks.filter((task) => task.priority === "low");
    if (activeTab === "no-priority")
      return suggestedTasks.filter((task) => !task.priority);
    return suggestedTasks;
  };

  const createSelectedTasks = async () => {
    try {
      setIsLoading(true);
      setProcessStep("creating");
      setTaskCreationResults({ successful: 0, failed: 0, inProgress: true });

      // Get the tasks to create
      const tasksToCreate = suggestedTasks.filter((task) =>
        selectedTaskIds.includes(task.id)
      );

      if (tasksToCreate.length === 0) {
        throw new Error("No tasks selected");
      }

      // Get the Supabase client and setup common data
      const supabase = clientConnectionWithSupabase();

      // Get current user session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }

      const userId = sessionData.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get workspace ID
      const { data: userData, error: userError } = await supabase
        .from("votum_users")
        .select("workspace_id")
        .eq("id", userId)
        .single();

      if (userError) {
        throw new Error(`Error getting workspace: ${userError.message}`);
      }

      const workspaceId = userData.workspace_id;

      // Get the max serial for the workspace
      const { data: maxSerialData, error: maxSerialError } = await supabase
        .from("votum_tasks")
        .select("serial")
        .eq("workspace_id", workspaceId)
        .order("serial", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxSerialError) {
        throw new Error(maxSerialError.message);
      }

      const nextSerial = (maxSerialData?.serial || 0) + 1;
      const now = new Date();

      let successfulCount = 0;
      let failedCount = 0;

      // Create tasks iteratively
      for (let idx = 0; idx < tasksToCreate.length; idx++) {
        const task = tasksToCreate[idx];

        try {
          // Update task status to creating
          setSuggestedTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, creationStatus: "creating" } : t
            )
          );

          // Create individual task data
          // For PST files, include email subject and sender in the task description
          const taskContent = task.description || "";
          const emailDetails =
            task.source === "pst" &&
            task.emailContext?.subject &&
            task.emailContext?.sender
              ? `From Email: ${task.emailContext.subject}\nSender: ${task.emailContext.sender}`
              : "";
          const enhancedTaskContent =
            emailDetails && !taskContent.includes(emailDetails)
              ? taskContent
                ? `${emailDetails}\n\n${taskContent}`
                : emailDetails
              : taskContent;

          const taskData = {
            serial: nextSerial + idx,
            name: task.title,
            priority: task.priority || "low",
            startDate: now.toISOString().slice(0, 10), // YYYY-MM-DD
            dueDate: task.dueDate || null,
            status: 0, // 0 = pending
            workspace_id: workspaceId,
            created_by: userId,
            last_updated_by: userId,
            sub_tasks: [],
            taskContent: enhancedTaskContent,
            last_updated_time: now.toISOString(),
          };

          // Insert individual task
          const { data: insertedData, error: insertError } = await supabase
            .from("votum_tasks")
            .insert([taskData])
            .select()
            .single();

          console.log("Inserted Task Data:", insertedData, insertError);

          if (insertError) {
            throw new Error(`Error saving task: ${insertError.message}`);
          }

          // Upload document for this task if available and not a PST file
          console.log(
            "Original Document:",
            originalDocument,
            insertedData,
            uploadType
          );

          if (
            originalDocument &&
            insertedData &&
            (uploadType == "scanned" || uploadType == "camera")
          ) {
            try {
              // Upload the original document to storage first
              const fileName = `tasks/${insertedData.id}/${Date.now()}_${
                originalDocument.name
              }`;

              const { data: uploadData, error: uploadError } =
                await supabase.storage
                  .from("votum_ocr_users_pdfs")
                  .upload(fileName, originalDocument);

              if (uploadError) {
                throw new Error(
                  `Failed to upload file: ${uploadError.message}`
                );
              }

              // Get the public URL of the uploaded file
              const { data: publicUrlData } = supabase.storage
                .from("votum_ocr_users_pdfs")
                .getPublicUrl(fileName);

              // Create a pre-processed document object to skip redundant OCR
              const documentData = extractedTextData || "Document processed";

              const documentsToAdd = [
                {
                  name: originalDocument.name,
                  url: publicUrlData.publicUrl,
                  document_data: documentData,
                },
              ];

              // Use the existing addTaskDocuments API
              const addDocumentsResult = await addTaskDocuments(
                insertedData,
                documentsToAdd
              );

              if (!addDocumentsResult.success) {
                console.warn(
                  `Document upload failed for task ${insertedData.id}:`,
                  addDocumentsResult.error
                );
                // Don't fail the task creation for document upload issues
              }
            } catch (documentError) {
              console.warn(
                `Document processing failed for task ${insertedData.id}:`,
                documentError
              );
              // Don't fail the task creation for document upload issues
            }
          }

          // Mark task as successful
          setSuggestedTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, creationStatus: "success" } : t
            )
          );

          successfulCount++;
          setTaskCreationResults((prev) => ({
            ...prev,
            successful: successfulCount,
            failed: failedCount,
          }));
        } catch (taskError) {
          console.error(`Failed to create task "${task.title}":`, taskError);

          // Mark task as failed
          setSuggestedTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    creationStatus: "failed",
                    errorMessage:
                      taskError instanceof Error
                        ? taskError.message
                        : "Unknown error occurred",
                  }
                : t
            )
          );

          failedCount++;
          setTaskCreationResults((prev) => ({
            ...prev,
            successful: successfulCount,
            failed: failedCount,
          }));
        }
      }

      // Show final results
      setTaskCreationResults((prev) => ({ ...prev, inProgress: false }));

      if (successfulCount > 0) {
        if (refreshTasks) {
          await refreshTasks();
        }
        if (failedCount === 0) {
          setShowTaskConfirmation(false);
        }

        toast({
          title: "Task creation completed",
          description: `${successfulCount} task${
            successfulCount !== 1 ? "s" : ""
          } created successfully${
            failedCount > 0 ? `, ${failedCount} failed` : ""
          }${
            originalDocument && uploadType !== "pst"
              ? " with source document attached"
              : ""
          }`,
          variant:
            successfulCount === tasksToCreate.length ? "success" : "warning",
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Some tasks failed to create",
          description: `${failedCount} task${
            failedCount !== 1 ? "s" : ""
          } failed to create. Check the details below and try again.`,
          variant: "destructive",
        });
      }

      // Only reset if all tasks succeeded
      if (failedCount === 0) {
        setTimeout(() => resetState(), 2000);
      }
    } catch (error) {
      console.error("Task creation process failed:", error);
      setTaskCreationResults((prev) => ({ ...prev, inProgress: false }));

      toast({
        title: "Failed to create tasks",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessStep("idle");
    }
  };

  const cancelTaskCreation = () => {
    resetState();
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles?.[0];
    if (!file) return;

    setFile({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    fileRejections,
    open,
  } = useDropzone({
    onDrop,
    accept:
      uploadType === "scanned"
        ? { "application/pdf": [".pdf"] }
        : uploadType === "camera"
        ? { "image/*": [] }
        : uploadType === "pst"
        ? { "application/vnd.ms-outlook": [".pst"] }
        : {},
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024, // 200MB to accommodate PST files
  });

  useEffect(() => {
    if (uploadDialogOpen && shouldOpenCamera && uploadType === "camera") {
      const timer = window.setTimeout(() => {
        open();
        setShouldOpenCamera(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }
    return;
  }, [open, shouldOpenCamera, uploadDialogOpen, uploadType]);

  const handleRemoveFile = (e) => {
    e?.stopPropagation?.();
    URL.revokeObjectURL(file?.previewUrl);
    setFile(null);
  };

  const handleViewFile = (e) => {
    e?.stopPropagation?.();
    if (file?.previewUrl) {
      window.open(file.previewUrl, "_blank");
    }
  };

  const handleDialogClose = () => {
    handleRemoveFile({});
    setUploadDialogOpen(false);
    setShouldOpenCamera(false);
  };

  const processDocument = async () => {
    if (!file) return;

    try {
      resetState();
      setIsLoading(true);
      setProcessStep("analyzing");
      setProcessingProgress(0);

      let text = null;
      const extractedPdfRes = null;
      const documentTitle = file.file.name || "Document";
      let extractedTasks: any[] = [];

      // Step 1: Extract text based on document type
      if (uploadType === "scanned") {
        setProcessingStep("Processing scanned document");
        setLastProcessedDocument("scanned document");
        setDocumentName(documentTitle);
        setOriginalDocument(file.file);
        setProcessingProgress(10);

        const extractedPdfRes = await extractTextFromScannedPdf(
          file.file,
          "en",
          false
        );

        setProcessingProgress(40);
        if (!extractedPdfRes?.success) {
          throw new Error("Failed to extract data from scanned document");
        }
        text = extractedPdfRes.extractedText;
        setExtractedTextData(text);
      } else if (uploadType === "camera") {
        setProcessingStep("Processing camera scan");
        setLastProcessedDocument("camera scan");
        setDocumentName("Camera Scan");
        setOriginalDocument(file.file);
        setProcessingProgress(10);

        const ocrRes = await extractTextFromImage(file.file);

        setProcessingProgress(40);
        if (!ocrRes?.success) {
          throw new Error("Failed to extract data from camera scan");
        }
        text = ocrRes.data;
        setExtractedTextData(text);
      } else if (uploadType === "pst") {
        throw new Error("PST processing is not supported");
      } else {
        if (!text) {
          throw new Error("No text extracted from document");
        }

        // Step 2: Extract tasks from the text (for non-PST files)
        setProcessingStep("Identifying tasks");
        setProcessingProgress(50);
        setProcessStep("identifying");

        const suggestedTaskRes = await extractTasksFromText(text);
        setProcessingProgress(80);
        if (!suggestedTaskRes?.success) {
          throw new Error("Failed to extract tasks from text");
        }

        extractedTasks = suggestedTaskRes?.data || [];
      }
      if (!extractedTasks || !extractedTasks.length) {
        toast({
          title: "No tasks found",
          description:
            "No tasks were identified in the document. Try another document or create tasks manually.",
          variant: "warning",
        });
        setSuggestedTasks([]);
        setShowTaskConfirmation(true);
        handleDialogClose();
        setProcessingProgress(100);
        return;
      }

      // Transform tasks and add IDs
      const tasksWithIds = extractedTasks.map((task) => {
        const baseDescription = task.description || task.task_content || "";
        const description = baseDescription;

        return {
          ...task,
          id: Math.random().toString(36).substring(2, 11),
          isEditing: false,
          source: "document" as const,
          title: task.title || task.task_title || "Untitled",
          description,
        };
      });

      setSuggestedTasks(tasksWithIds);
      setSelectedTaskIds(tasksWithIds.map((task) => task.id)); // Select all by default
      setShowTaskConfirmation(true);
      setProcessStep("reviewing");
      setProcessingProgress(100);
      // handleDialogClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
      // handleDialogClose();
    }
  };

  useEffect(() => {
    if (fileRejections.length > 0) {
      if (fileRejections?.[0].errors?.[0].code === "file-invalid-type") {
        toast({
          title: "Invalid file type",
          description:
            uploadType === "scanned"
              ? "Please upload a PDF file"
              : uploadType === "camera"
              ? "Please upload an image file"
              : "Please upload a PST file",
          variant: "destructive",
        });
      } else if (fileRejections?.[0].errors?.[0].code === "file-too-large") {
        toast({
          title: "File too large",
          description: "Please upload a file less than 200MB",
          variant: "destructive",
        });
      }
    }
  }, [fileRejections, uploadType, toast]);

  const handleFromScannedDocumentClick = () => {
    setUploadType("scanned");
    setUploadDialogOpen(true);
  };

  const handleScanNewDocumentClick = () => {
    setUploadType("camera");
    setUploadDialogOpen(true);
    setShouldOpenCamera(true);
  };

  const handleUploadPstFileClick = () => {
    setUploadType("pst");
    setUploadDialogOpen(true);
  };

  const handleTryAgain = () => {
    resetState();
  };

  const getTaskCountByPriority = () => {
    const counts = {
      high: suggestedTasks.filter((t) => t.priority === "high").length,
      medium: suggestedTasks.filter((t) => t.priority === "medium").length,
      low: suggestedTasks.filter((t) => t.priority === "low").length,
      none: suggestedTasks.filter((t) => !t.priority).length,
    };
    return counts;
  };

  const priorityCounts = getTaskCountByPriority();

  const renderProgress = () => {
    const steps = [
      { key: "analyzing", label: "Analyzing Document" },
      { key: "identifying", label: "Identifying Tasks" },
      { key: "reviewing", label: "Reviewing Tasks" },
      { key: "creating", label: "Creating Tasks" },
    ];

    console.log(`uploadType: ${uploadType}, processStep: ${processStep}, `);

    return (
      <div className="w-full py-4">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={cn(
                "flex flex-col items-center w-1/4 relative",
                index < steps.length - 1 &&
                  "after:content-[''] after:absolute after:w-full after:h-[2px] after:bg-muted after:top-3 after:left-1/2"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full z-10 flex items-center justify-center text-xs font-medium",
                  processStep === step.key
                    ? "bg-primary text-primary-foreground"
                    : steps.findIndex((s) => s.key === processStep) > index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {steps.findIndex((s) => s.key === processStep) > index ? (
                  <Check className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1",
                  processStep === step.key
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <Button
              className={cn(
                "gap-2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
                buttonClassName
              )}
              variant={buttonVariant}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>From Document</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={handleFromScannedDocumentClick}>
              <FileText className="mr-2 h-4 w-4" />
              Upload Scanned Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleScanNewDocumentClick}>
              <Camera className="mr-2 h-4 w-4" />
              Scan New Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUploadPstFileClick}>
              <FileUp className="mr-2 h-4 w-4" />
              Upload PST File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {uploadType === "scanned"
                ? "Upload Scanned Document"
                : uploadType === "camera"
                ? "Scan New Document"
                : "Upload PST File"}
            </DialogTitle>
            <DialogDescription>
              {uploadType === "scanned"
                ? "Select or drag and drop a scanned document to upload."
                : uploadType === "camera"
                ? "Add images to scan and process"
                : "Select a PST file to upload"}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex justify-center items-center">
            {file ? (
              <div className="w-full flex flex-col gap-2">
                {uploadType === "scanned" || uploadType === "pst" ? (
                  <div className="w-full p-2 flex items-center justify-between bg-gray-300 rounded-md">
                    <p>{file?.file?.name}</p>
                    <div className="flex items-center gap-2">
                      {uploadType === "scanned" && (
                        <Button
                          onClick={handleViewFile}
                          className="gap-3"
                          variant="ghost"
                          size="icon"
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={!file || isLoading}
                        onClick={handleRemoveFile}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ) : uploadType === "camera" ? (
                  <div className="relative" onClick={handleViewFile}>
                    <img
                      src={file.previewUrl}
                      alt={`Preview`}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <Button
                      onClick={handleRemoveFile}
                      size="icon"
                      className="bg-red-500 text-white absolute -top-2 -right-2 rounded-full p-1 w-fit h-fit"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative" onClick={handleViewFile}>
                    <img
                      src={file.previewUrl}
                      alt={`Preview`}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <Button
                      onClick={handleRemoveFile}
                      size="icon"
                      className="bg-red-500 text-white absolute -top-2 -right-2 rounded-full p-1 w-fit h-fit"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={processDocument}
                  disabled={isLoading}
                  className="gap-3 w-full"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  <span>Continue</span>
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className="w-full border border-dashed border-gray-400 h-52 flex justify-center items-center rounded-md"
              >
                <input
                  {...getInputProps({
                    capture: uploadType === "camera" ? "environment" : undefined,
                  })}
                />
                {isDragActive ? (
                  <p>
                    Drop the{" "}
                    {uploadType === "scanned"
                      ? "files"
                      : uploadType === "camera"
                      ? "images"
                      : "PST file"}{" "}
                    here ...
                  </p>
                ) : (
                  <p>
                    Drag 'n' drop some{" "}
                    {uploadType === "scanned"
                      ? "files"
                      : uploadType === "camera"
                      ? "images"
                      : "PST file"}{" "}
                    here, or click to select{" "}
                    {uploadType === "scanned"
                      ? "files"
                      : uploadType === "camera"
                      ? "images"
                      : "PST file"}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Processing Dialog */}
      <Dialog open={!!processingStep} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Document</DialogTitle>
            <DialogDescription>
              {processingStep}... Please wait while we analyze your document.
            </DialogDescription>
          </DialogHeader>

          {renderProgress()}

          <div className="py-3">
            <Progress value={processingProgress} className="w-full" />
          </div>

          {pollingStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Polling Status:</span>
                <span className="capitalize font-medium">
                  {pollingStatus.status}
                </span>
              </div>
              {pollingStatus.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Email Progress:
                    </span>
                    <span className="font-medium">
                      {pollingStatus.progress.current_email}/
                      {pollingStatus.progress.total_emails}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Current Folder:
                    </span>
                    <span className="font-medium text-xs">
                      {pollingStatus.progress.current_folder}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center text-sm text-muted-foreground animate-pulse">
            This may take a moment depending on the document size
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Confirmation Dialog */}
      <Dialog
        open={showTaskConfirmation}
        onOpenChange={(open) => {
          if (!open) cancelTaskCreation();
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              <span>Suggested Tasks from {documentName}</span>
            </DialogTitle>
            <DialogDescription>
              We found {suggestedTasks.length} potential tasks in your document.
              Review and select the ones you want to save.
            </DialogDescription>
          </DialogHeader>

          {renderProgress()}

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all" className="relative">
                  All
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {suggestedTasks.length}
                  </Badge>
                </TabsTrigger>
                {priorityCounts.high > 0 && (
                  <TabsTrigger value="high" className="relative">
                    High Priority
                    <Badge variant="destructive" className="ml-1.5 text-xs">
                      {priorityCounts.high}
                    </Badge>
                  </TabsTrigger>
                )}
                {priorityCounts.medium > 0 && (
                  <TabsTrigger value="medium" className="relative">
                    Medium
                    <Badge variant="secondary" className="ml-1.5 text-xs">
                      {priorityCounts.medium}
                    </Badge>
                  </TabsTrigger>
                )}
                {priorityCounts.low > 0 && (
                  <TabsTrigger value="low" className="relative">
                    Low
                    <Badge variant="outline" className="ml-1.5 text-xs">
                      {priorityCounts.low}
                    </Badge>
                  </TabsTrigger>
                )}
                {priorityCounts.none > 0 && (
                  <TabsTrigger value="no-priority" className="relative">
                    No Priority
                    <Badge variant="outline" className="ml-1.5 text-xs">
                      {priorityCounts.none}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              <Button
                variant="outline"
                size="sm"
                onClick={selectAllTasks}
                className="gap-1.5"
              >
                <Checkbox
                  checked={
                    getFilteredTasks().length > 0 &&
                    getFilteredTasks().every((task) =>
                      selectedTaskIds.includes(task.id)
                    )
                  }
                  className="h-3.5 w-3.5"
                />
                <span>
                  Select{" "}
                  {getFilteredTasks().length > 0 &&
                  getFilteredTasks().every((task) =>
                    selectedTaskIds.includes(task.id)
                  )
                    ? "None"
                    : "All"}
                </span>
              </Button>
            </div>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-3">
                {suggestedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onSelect={() => handleTaskSelection(task.id)}
                    onEdit={() => startTaskEditing(task.id)}
                    onSave={(updates) => saveTaskEdit(task.id, updates)}
                    onCancel={() => cancelTaskEdit(task.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="high" className="mt-4">
              <div className="space-y-3">
                {suggestedTasks
                  .filter((task) => task.priority === "high")
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onSelect={() => handleTaskSelection(task.id)}
                      onEdit={() => startTaskEditing(task.id)}
                      onSave={(updates) => saveTaskEdit(task.id, updates)}
                      onCancel={() => cancelTaskEdit(task.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="medium" className="mt-4">
              <div className="space-y-3">
                {suggestedTasks
                  .filter((task) => task.priority === "medium")
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onSelect={() => handleTaskSelection(task.id)}
                      onEdit={() => startTaskEditing(task.id)}
                      onSave={(updates) => saveTaskEdit(task.id, updates)}
                      onCancel={() => cancelTaskEdit(task.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="low" className="mt-4">
              <div className="space-y-3">
                {suggestedTasks
                  .filter((task) => task.priority === "low")
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onSelect={() => handleTaskSelection(task.id)}
                      onEdit={() => startTaskEditing(task.id)}
                      onSave={(updates) => saveTaskEdit(task.id, updates)}
                      onCancel={() => cancelTaskEdit(task.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="no-priority" className="mt-4">
              <div className="space-y-3">
                {suggestedTasks
                  .filter((task) => !task.priority)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onSelect={() => handleTaskSelection(task.id)}
                      onEdit={() => startTaskEditing(task.id)}
                      onSave={(updates) => saveTaskEdit(task.id, updates)}
                      onCancel={() => cancelTaskEdit(task.id)}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* If no tasks, show the alert here */}
          {suggestedTasks.length === 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No tasks found</AlertTitle>
                  <AlertDescription>
                    <p className="mb-3">
                      We couldn't identify any tasks in your{" "}
                      {lastProcessedDocument}.
                    </p>
                    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={resetState}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try Another Document
                      </Button>
                      <Button size="sm" className="gap-2" onClick={resetState}>
                        <Plus className="h-4 w-4" />
                        Create Task Manually
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Task Creation Results */}
          {(taskCreationResults.successful > 0 ||
            taskCreationResults.failed > 0) && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-medium">Results:</span>
                    {taskCreationResults.successful > 0 && (
                      <Badge variant="default" className="ml-2">
                        {taskCreationResults.successful} Created
                      </Badge>
                    )}
                    {taskCreationResults.failed > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {taskCreationResults.failed} Failed
                      </Badge>
                    )}
                  </div>
                </div>
                {taskCreationResults.failed > 0 &&
                  !taskCreationResults.inProgress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryFailedTasks}
                      disabled={isLoading}
                      className="gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry Failed
                    </Button>
                  )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 mt-6">
            <Button variant="outline" onClick={cancelTaskCreation}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {selectedTaskIds.length} task
                {selectedTaskIds.length !== 1 ? "s" : ""} selected
              </div>
              <Button
                onClick={createSelectedTasks}
                disabled={selectedTaskIds.length === 0 || isLoading}
                className="gap-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {taskCreationResults.inProgress
                      ? "Creating..."
                      : "Saving..."}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Tasks
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TaskCardProps {
  task: SuggestedTask;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onSave: (updates: Partial<SuggestedTask>) => void;
  onCancel: () => void;
}

function TaskCard({
  task,
  isSelected,
  onSelect,
  onEdit,
  onSave,
  onCancel,
}: TaskCardProps) {
  const [updatedTask, setUpdatedTask] = React.useState({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    source: task.source,
  });
  const [date, setDate] = React.useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );

  React.useEffect(() => {
    if (task.isEditing) {
      setUpdatedTask({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        source: task.source,
      });
      setDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
  }, [
    task.isEditing,
    task.title,
    task.description,
    task.dueDate,
    task.priority,
    task.source,
  ]);

  const handleSave = () => {
    onSave({
      ...updatedTask,
      dueDate: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  if (task.isEditing) {
    return (
      <motion.div
        initial={{ scale: 0.98, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="border rounded-lg p-4 shadow-sm bg-muted/30"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`task-title-${task.id}`}
              className="text-sm font-medium block mb-1"
            >
              Task Title
            </label>
            <Input
              id={`task-title-${task.id}`}
              value={updatedTask.title}
              onChange={(e) =>
                setUpdatedTask({ ...updatedTask, title: e.target.value })
              }
              placeholder="Task title"
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor={`task-desc-${task.id}`}
              className="text-sm font-medium block mb-1"
            >
              Description
            </label>
            <Textarea
              id={`task-desc-${task.id}`}
              value={updatedTask.description}
              onChange={(e) =>
                setUpdatedTask({ ...updatedTask, description: e.target.value })
              }
              placeholder="Task description"
              className="w-full min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Set due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Priority</label>
              <Select
                value={updatedTask.priority}
                onValueChange={(value: any) =>
                  setUpdatedTask({ ...updatedTask, priority: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Source</label>
            <Select
              value={updatedTask.source}
              onValueChange={(value: "email" | "document" | "pst") =>
                setUpdatedTask({ ...updatedTask, source: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="pst">PST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "transition-all border",
          isSelected ? "border-primary" : "",
          task.creationStatus === "success" &&
            "border-green-500 bg-green-50/50",
          task.creationStatus === "failed" && "border-red-500 bg-red-50/50",
          task.creationStatus === "creating" && "border-blue-500 bg-blue-50/50",
          "hover:shadow-md"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-2">
              <Checkbox
                id={`task-${task.id}`}
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
                disabled={
                  task.creationStatus === "success" ||
                  task.creationStatus === "creating"
                }
              />
              {/* Status indicator */}
              {task.creationStatus === "creating" && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {task.creationStatus === "success" && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {task.creationStatus === "failed" && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "font-medium",
                    task.creationStatus === "success" && "text-green-700",
                    task.creationStatus === "failed" && "text-red-700"
                  )}
                >
                  {task.title}
                  {task.creationStatus === "creating" && (
                    <span className="ml-2 text-blue-600 text-sm">
                      Creating...
                    </span>
                  )}
                  {task.creationStatus === "success" && (
                    <span className="ml-2 text-green-600 text-sm">Created</span>
                  )}
                  {task.creationStatus === "failed" && (
                    <span className="ml-2 text-red-600 text-sm">Failed</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onEdit}
                  disabled={
                    task.creationStatus === "success" ||
                    task.creationStatus === "creating"
                  }
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {task.description}
              </p>

              {/* Show error message for failed tasks */}
              {task.creationStatus === "failed" && task.errorMessage && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{task.errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Show email context for PST-extracted tasks */}
              {task.emailContext && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                  <span className="font-medium">From Email:</span>{" "}
                  {task.emailContext.subject}
                  <br />
                  <span className="font-medium">Sender:</span>{" "}
                  {task.emailContext.sender}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {task.dueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </Badge>
                )}
                {task.priority && (
                  <Badge
                    variant={
                      task.priority === "high"
                        ? "destructive"
                        : task.priority === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    <FlagIcon className="h-3 w-3 mr-1" />
                    {task.priority}
                  </Badge>
                )}
                {task.source && (
                  <Badge variant="outline" className="capitalize">
                    {task.source === "email" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 mr-1"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    ) : task.source === "pst" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 mr-1"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        <path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                      </svg>
                    ) : (
                      <FileText className="h-3 w-3 mr-1" />
                    )}
                    {task.source}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default NewTaskFromDocument;
