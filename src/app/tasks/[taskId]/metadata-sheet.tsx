"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Loader2, LoaderCircle, NotebookPen } from "lucide-react";

interface MetadataSheetProps {
  selectedMetaDocument: string;
  setSelectedMetaDocument: any;
  taskData: any;
  handleGenerateMetaData: () => void;
  isFetchingMetaData?: boolean;
  disabled?: boolean;
}

const DisplayData = ({ data }) => {
  const formatKey = (key) =>
    key
      .split("_")
      .join(" ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const renderData = (data) => {
    return Object.entries(data).map(([key, value]) => {
      console.log(value);
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return (
          <div key={key} className="flex flex-col gap-3 ">
            <p className="font-bold text-xs capitalize">{formatKey(key)}</p>
            <ul className="flex flex-col gap-3 pl-4  "> {renderData(value)}</ul>
          </div>
        );
      } else if (Array.isArray(value)) {
        return (
          <li key={key} className="text-xs">
            {`${formatKey(key)}: `}
            <ul className="pl-4">
              {value.map((item, index) => (
                <li key={index}>
                  {typeof item === "object" && item !== null ? (
                    <div className="pl-4">{renderData(item)}</div>
                  ) : (
                    String(item)
                  )}
                </li>
              ))}
            </ul>
          </li>
        );
      } else {
        return (
          <li key={key} className="text-xs ">
            {`${formatKey(key)}: ${String(value)}`}
          </li>
        );
      }
    });
  };

  return <div>{renderData(data)}</div>;
};

function MetadataSheet({
  selectedMetaDocument,
  setSelectedMetaDocument,
  handleGenerateMetaData,
  isFetchingMetaData,
  disabled,
  taskData,
}: MetadataSheetProps) {
  // Filter out any duplicate documents by name
  const uniqueDocuments =
    taskData?.documents?.filter(
      (doc, index, self) => index === self.findIndex((d) => d.name === doc.name)
    ) || [];

  // Get the document with metadata
  const documentWithMeta = selectedMetaDocument
    ? uniqueDocuments.find((doc) => doc.name === selectedMetaDocument)
    : null;

  console.log("documentWithMeta", documentWithMeta);

  // Check if the document already has metadata
  const hasMetadata = documentWithMeta?.metaData;

  console.log("documentWithMeta", documentWithMeta);

  return (
    <Sheet open={false}>
      <SheetTrigger asChild disabled={disabled}>
        {/* <Button variant="default" className="w-full">
          <Database className="mr-2 h-4 w-4" />
          <span>Document Metadata</span>
        </Button> */}
      </SheetTrigger>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Document Metadata</SheetTitle>
          <SheetDescription>
            View and extract metadata from documents.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Select
              value={selectedMetaDocument}
              onValueChange={(value) => {
                if (value !== "no-documents") {
                  setSelectedMetaDocument(value);
                }
              }}
            >
              <SelectTrigger className="w-full" disabled={isFetchingMetaData}>
                <SelectValue placeholder="Select document" />
              </SelectTrigger>
              <SelectContent>
                {uniqueDocuments && uniqueDocuments.length > 0 ? (
                  uniqueDocuments.map((doc) => (
                    <SelectItem key={doc.name} value={doc.name}>
                      {doc.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-documents" disabled>
                    No documents found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              disabled={!selectedMetaDocument || isFetchingMetaData}
              onClick={handleGenerateMetaData}
              className="min-w-[130px] bg-white border border-[#EDEDEA] text-[#6b6b6b] text-sm rounded-lg hover:bg-[#F3F2EF]"
            >
              {isFetchingMetaData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : hasMetadata ? (
                <>
                  <NotebookPen className="mr-2 h-4 w-4" />
                  Refresh
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Extract
                </>
              )}
            </Button>
          </div>

          {/* Display Document Metadata */}
          {selectedMetaDocument && documentWithMeta?.metaData && (
            <Tabs defaultValue="table" className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="json">JSON View</TabsTrigger>
              </TabsList>
              <TabsContent value="table" className="mt-2">
                <Table>
                  <TableCaption>Document metadata</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(documentWithMeta.metaData).map(
                      ([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="break-words">
                            {typeof value === "boolean"
                              ? value.toString()
                              : typeof value === "string"
                                ? value
                                : JSON.stringify(value)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="json" className="mt-2">
                <pre className="bg-[#F3F2EF] p-4 rounded-xl overflow-auto max-h-[500px] text-sm text-[#1a1a1a]">
                  {JSON.stringify(documentWithMeta.metaData, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}

          {selectedMetaDocument &&
            !documentWithMeta?.metaData &&
            !isFetchingMetaData && (
              <div className="flex flex-col gap-2 items-center justify-center h-40 bg-white rounded-xl">
                <Database className="h-10 w-10 text-[#DEDBD5]" />
                <p className="text-[#6b6b6b] text-sm">No metadata available</p>
                <p className="text-[#b0b0aa] text-xs">
                  Click the "Extract" button to generate metadata
                </p>
              </div>
            )}

          {isFetchingMetaData && (
            <div className="flex flex-col gap-2 items-center justify-center h-40 bg-white rounded-xl">
              <LoaderCircle className="h-10 w-10 text-[#DEDBD5] animate-spin" />
              <p className="text-[#6b6b6b] text-sm">Generating metadata...</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MetadataSheet;
