import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  PlusIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Document {
  name: string;
  url?: string;
  document_data?: any;
  type?: string;
  size?: number;
  uploaded_at?: string;
}

interface SimplifiedOCRUploadProps {
  onDocumentAdd: (file: File) => Promise<void>;
  // Support both documentList (legacy) and documents (new standard)
  documentList?: any[];
  documents?: Document[];
  onDocumentRemove?: (file: any) => Promise<void>;
  onDocumentView?: (document: Document) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

const SimplifiedOCRUpload: React.FC<SimplifiedOCRUploadProps> = ({
  onDocumentAdd,
  documentList,
  documents,
  onDocumentRemove,
  onDocumentView,
  isUploading = false,
  className = "",
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);
  const [scanImages, setScanImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [localDocuments, setLocalDocuments] = useState<Document[]>([]);
  const [shouldOpenCamera, setShouldOpenCamera] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Use documents prop if provided, otherwise fall back to documentList
  const propsDocuments = documents || documentList || [];

  // Merge props documents with local documents, removing duplicates
  const allDocuments = [...propsDocuments];

  // Add local documents that aren't already in props
  localDocuments.forEach((localDoc) => {
    if (!propsDocuments.some((propsDoc) => propsDoc.name === localDoc.name)) {
      allDocuments.push(localDoc);
    }
  });

  // Filter out any duplicate documents - ensure only unique filenames are shown
  const uniqueDocuments = allDocuments.filter(
    (doc, index, self) => index === self.findIndex((d) => d.name === doc.name)
  );

  // Clean up local documents when they appear in props
  useEffect(() => {
    setLocalDocuments((prev) =>
      prev.filter(
        (localDoc) =>
          !propsDocuments.some((propsDoc) => propsDoc.name === localDoc.name)
      )
    );
  }, [propsDocuments]);

  useEffect(() => {
    if (isScanDialogOpen && shouldOpenCamera && cameraInputRef.current) {
      // Ensure dialog content is mounted before triggering camera input.
      const timer = window.setTimeout(() => {
        cameraInputRef.current?.click();
        setShouldOpenCamera(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }
    return;
  }, [isScanDialogOpen, shouldOpenCamera]);

  const handleDocumentUpload = () => {
    setIsDialogOpen(true);
  };

  const handleDocumentTypeSelection = async (type: "pdf" | "scan-new") => {
    setIsDialogOpen(false);

    if (type === "pdf") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        "application/pdf,image/*,.docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      input.multiple = true;

      input.onchange = async (e: any) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          setLocalUploading(true);
          try {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const fileName = file.name;

              // Skip files with names that already exist
              const fileExists = allDocuments.some(
                (doc) => doc.name === fileName
              );

              if (!fileExists) {
                // Add to local state immediately for real-time feedback
                const newDoc: Document = {
                  name: fileName,
                  type: file.type,
                  size: file.size,
                  uploaded_at: new Date().toISOString(),
                };
                setLocalDocuments((prev) => [...prev, newDoc]);

                // Upload the file
                await onDocumentAdd(file);
              }
            }
          } catch (error) {
            console.error("Error uploading files:", error);
            // Remove failed uploads from local state
            setLocalDocuments((prev) =>
              prev.filter(
                (doc) =>
                  !Array.from(files).some(
                    (file: File) => file.name === doc.name
                  )
              )
            );
          } finally {
            setLocalUploading(false);
          }
        }
      };

      input.click();
    } else if (type === "scan-new") {
      setIsScanDialogOpen(true);
      setScanImages([]);
      setPreviewUrls([]);
      setShouldOpenCamera(true);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Filter out images with names that already exist
    const newFiles = files.filter(
      (file) =>
        !allDocuments.some((doc) => doc.name === file.name) &&
        !scanImages.some((img) => img.name === file.name)
    );

    if (newFiles.length === 0) return;

    setScanImages((prevImages) => [...prevImages, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prevUrls) => [...prevUrls, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const removeImage = (index: number) => {
    setScanImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setPreviewUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const finalizeScan = async () => {
    if (scanImages.length === 0) {
      return;
    }

    setIsScanDialogOpen(false);
    setLocalUploading(true);

    try {
      for (const image of scanImages) {
        // Add to local state immediately for real-time feedback
        const newDoc: Document = {
          name: image.name,
          type: image.type,
          size: image.size,
          uploaded_at: new Date().toISOString(),
        };
        setLocalDocuments((prev) => [...prev, newDoc]);

        // Upload the image
        await onDocumentAdd(image);
      }
    } catch (error) {
      console.error("Error processing scanned images:", error);
      // Remove failed uploads from local state
      setLocalDocuments((prev) =>
        prev.filter((doc) => !scanImages.some((img) => img.name === doc.name))
      );
    } finally {
      setLocalUploading(false);
      setScanImages([]);
      setPreviewUrls([]);
    }
  };

  const handleRemoveDocument = async (doc: any) => {
    if (onDocumentRemove) {
      await onDocumentRemove(doc);
    }
    // Also remove from local state if it exists there
    setLocalDocuments((prev) =>
      prev.filter((localDoc) => localDoc.name !== doc.name)
    );
  };

  console.log("uniqueDocuments", uniqueDocuments);

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full flex items-center">
        <div className="base:w-[65%] tv:w-[72%] flex flex-wrap gap-2">
          {uniqueDocuments.length > 0
            ? uniqueDocuments.map((doc, index) => (
                <div
                  key={`${doc.name}-${index}`}
                  className="flex border border-gray-300 rounded-full items-center pr-2 bg-gray-50"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-500 p-1"
                    onClick={() => handleRemoveDocument(doc)}
                    disabled={isUploading || localUploading}
                  >
                    <X size={14} />
                  </Button>
                  <span
                    className="text-sm truncate max-w-[150px] cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={() => onDocumentView && onDocumentView(doc)}
                  >
                    {doc.name}
                  </span>
                </div>
              ))
            : null}
          <Button
            variant="ghost"
            className="hover:cursor-pointer hover:bg-[#efefef] p-2 rounded-full"
            onClick={handleDocumentUpload}
            disabled={isUploading || localUploading}
          >
            {isUploading || localUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <PlusIcon width={20} height={20} />
            )}
          </Button>
        </div>
      </div>

      {/* Document Type Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Choose the type of document you want to upload
          </DialogDescription>
          <div className="flex flex-col space-y-2 mt-4">
            <Button onClick={() => handleDocumentTypeSelection("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              Upload PDF, Image, DOCX, or XLSX
            </Button>
            <Button onClick={() => handleDocumentTypeSelection("scan-new")}>
              <Camera className="mr-2 h-4 w-4" />
              Scan New Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scan Document Dialog */}
      <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
        <DialogContent>
          <DialogTitle>Scan New Document</DialogTitle>
          <DialogDescription>Add images to scan and process</DialogDescription>
          <div className="flex flex-wrap gap-2 mt-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index}`}
                  className="w-24 h-24 object-cover rounded"
                />
                <Button
                  variant="ghost"
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                  onClick={() => removeImage(index)}
                >
                  <X width={12} height={12} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
            <Button onClick={handleCameraCapture}>
              <Camera className="mr-2 h-4 w-4" />
              Capture Image
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={finalizeScan}
            disabled={scanImages.length === 0 || localUploading}
            className="mt-4"
          >
            {localUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Images"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimplifiedOCRUpload;
