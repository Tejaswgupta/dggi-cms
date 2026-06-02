import clientConnectionWithSupabase from "@/lib/supabase/client";

export interface FileAttachment {
  id: string;
  entityType: "reconciliation" | "transaction";
  entityId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  publicUrl?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: "File exceeds 10MB limit" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: "File type not supported" };
  }
  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType === "application/pdf") return "📄";
  if (fileType.includes("word")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  return "📎";
}

export async function uploadFileToStorage(
  file: File,
  bucket: string,
  folder: string
): Promise<{
  success: boolean;
  file?: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    publicUrl: string;
  };
  error?: string;
}> {
  try {
    const supabase = clientConnectionWithSupabase();
    const fileName = `${folder}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { contentType: file.type });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      file: {
        id: fileName,
        fileName: file.name,
        filePath: fileName,
        fileSize: file.size,
        fileType: file.type,
        publicUrl: publicUrlData.publicUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFileAttachment(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // id is the filePath used during upload
    const supabase = clientConnectionWithSupabase();
    const bucket = id.startsWith("reconciliations")
      ? "trust-reconciliation-files"
      : "trust-transaction-attachments";

    const { error } = await supabase.storage.from(bucket).remove([id]);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}
