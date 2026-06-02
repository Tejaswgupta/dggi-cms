"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteFileAttachment,
  formatFileSize,
  getFileIcon,
  uploadFileToStorage,
  validateFile,
  type FileAttachment,
} from "@/lib/file-upload";
import { cn } from "@/lib/utils";
import { Download, FileIcon, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface FileUploadProps {
  entityType: "reconciliation" | "transaction";
  entityId?: string;
  existingFiles?: FileAttachment[];
  onFilesChange?: (files: FileAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export function FileUpload({
  entityType,
  entityId,
  existingFiles = [],
  onFilesChange,
  maxFiles = 10,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [attachedFiles, setAttachedFiles] =
    useState<FileAttachment[]>(existingFiles);
  const { toast } = useToast();

  useEffect(() => {
    setAttachedFiles(existingFiles);
  }, [existingFiles]);

  useEffect(() => {
    onFilesChange?.(attachedFiles);
  }, [attachedFiles, onFilesChange]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
      // Reset the input
      e.target.value = "";
    },
    []
  );

  const handleFiles = async (files: File[]) => {
    if (
      attachedFiles.length + uploadingFiles.length + files.length >
      maxFiles
    ) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    // Validate all files first
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Initialize uploading state
    const newUploadingFiles = validFiles.map((file) => ({
      file,
      progress: 0,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload files
    for (const uploadingFile of newUploadingFiles) {
      try {
        // Simulate progress (in real implementation, you'd use upload progress callback)
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === uploadingFile.file ? { ...uf, progress: 50 } : uf
          )
        );

        const bucket =
          entityType === "reconciliation"
            ? "trust-reconciliation-files"
            : "trust-transaction-attachments";

        const folder =
          entityType === "reconciliation" ? "reconciliations" : "transactions";

        const result = await uploadFileToStorage(
          uploadingFile.file,
          bucket,
          folder
        );

        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === uploadingFile.file ? { ...uf, progress: 100 } : uf
          )
        );

        if (result.success && result.file) {
          // Add to attached files (simulating database record)
          const newAttachment: FileAttachment = {
            id: result.file.id,
            entityType,
            entityId: entityId || "temp",
            fileName: result.file.fileName,
            filePath: result.file.filePath,
            fileSize: result.file.fileSize,
            fileType: result.file.fileType,
            uploadedBy: "current-user", // In real app, get from auth
            createdAt: new Date().toISOString(),
            publicUrl: result.file.publicUrl,
          };

          setAttachedFiles((prev) => [...prev, newAttachment]);

          toast({
            title: "File uploaded",
            description: `${uploadingFile.file.name} uploaded successfully`,
          });
        } else {
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === uploadingFile.file
                ? { ...uf, error: result.error }
                : uf
            )
          );

          toast({
            title: "Upload failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === uploadingFile.file
              ? { ...uf, error: "Upload failed" }
              : uf
          )
        );

        toast({
          title: "Upload failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }

    // Remove completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles((prev) =>
        prev.filter((uf) => uf.progress < 100 && !uf.error)
      );
    }, 2000);
  };

  const handleDeleteFile = async (attachment: FileAttachment) => {
    try {
      const result = await deleteFileAttachment(attachment.id);

      if (result.success) {
        setAttachedFiles((prev) => prev.filter((f) => f.id !== attachment.id));
        toast({
          title: "File deleted",
          description: `${attachment.fileName} has been deleted`,
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = (attachment: FileAttachment) => {
    if (attachment.publicUrl) {
      window.open(attachment.publicUrl, "_blank");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files here, or click to select files
            <br />
            <span className="text-xs">
              Supports: PDF, Images, Word, Excel (max 10MB each)
            </span>
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.docx,.xlsx"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            id="file-upload-input"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              document.getElementById("file-upload-input")?.click()
            }
          >
            <FileIcon className="h-4 w-4 mr-2" />
            Select Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {attachedFiles.length + uploadingFiles.length} / {maxFiles} files
          </p>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading Files</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getFileIcon(uploadingFile.file.type)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadingFile.error ? (
                    <span className="text-xs text-red-500">
                      {uploadingFile.error}
                    </span>
                  ) : (
                    <div className="w-20">
                      <Progress
                        value={uploadingFile.progress}
                        className="h-2"
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadingFiles((prev) =>
                        prev.filter((uf) => uf.file !== uploadingFile.file)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files</h4>
          {attachedFiles.map((attachment) => (
            <Card key={attachment.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getFileIcon(attachment.fileType)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)} •{" "}
                      {new Date(attachment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(attachment)}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(attachment)}
                    title="Delete file"
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
