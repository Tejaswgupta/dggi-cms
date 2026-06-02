import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";

export async function extractTextFromScannedPdf(
  file?: File,
  lang: string = "en",
  storeInDatabase: boolean = false,
  metadata?: {
    userId?: string;
    pdfUrl?: string;
    filename?: string;
    tags?: string[];
    documentType?: string;
    clientId?: string;
    language?: string;
    existingDocumentId?: string;
  }
): Promise<{
  success: boolean;
  ocrData?: any;
  extractedText?: string;
  error?: string;
}> {
  try {
    console.log("Extracting text from scanned document");
    if (!file) {
      throw new Error("No file provided");
    }

    const formData = new FormData();
    formData.append("in_file", file);

    const ocrRes = await fetch(`https://ai.thevotum.com/ocr?langs=${lang}`, {
      method: "POST",
      body: formData,
    });

    if (!ocrRes.ok) {
      console.log("OCR processing failed due to", await ocrRes.json());
      throw new Error(
        `OCR processing failed due to ${ocrRes.statusText} ${ocrRes.status}`
      );
    }

    const ocrData = await ocrRes.json();

    // Extract plain text from OCR data
    const extractedText = ocrData.results
      ? ocrData.results.map((page) => page.texts.join("\n")).join("\n\n")
      : null;

    // If storeInDatabase is true and we have all required metadata, store in the database
    if (storeInDatabase && metadata?.userId && metadata?.pdfUrl) {
      try {
        const supabase = clientConnectionWithSupabase();
        const workspace_id = await getWorkspaceId();
        const nowIso = new Date().toISOString();

        // Store only document metadata, not the full extracted text
        const metadataToSave = {
          user_id: metadata.userId,
          pdf_url: metadata.pdfUrl,
          filename: metadata.filename || `ocr_document_${Date.now()}.pdf`,
          tags: metadata.tags || [],
          document_type: metadata.documentType || "ocr_processed",
          language: lang,
          client_id: metadata.clientId,
          workspace_id: workspace_id,
          extracted_text: extractedText,
        };

        // Check if we need to update an existing document or insert a new one
        if (metadata.existingDocumentId) {
          // Update existing document
          await supabase
            .from("task_documents")
            .update({
              ...metadataToSave,
              updated_at: nowIso,
            })
            .eq("id", metadata.existingDocumentId);
          console.log("OCR metadata updated in database successfully");
        } else {
          // Insert new document
          await supabase
            .from("task_documents")
            .insert([metadataToSave]);
          console.log("OCR metadata stored in database successfully");
        }
      } catch (dbError) {
        console.error("Error storing OCR metadata in database:", dbError);
        // We continue with the operation as extracting text is the primary function
      }
    }

    return {
      success: true,
      ocrData: ocrData,
      extractedText: extractedText,
    };
  } catch (error) {
    console.log("Error in extractTextFromScannedDocument", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract text from scanned document",
    };
  }
}
