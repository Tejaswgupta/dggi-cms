"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  FormattingToolbar,
  FormattingToolbarController,
  getFormattingToolbarItems,
  useCreateBlockNote,
} from "@blocknote/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import "../../../blocknote.scss";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  newTask?: boolean;
  taskId: string;
  taskName?: string;
}

const Editor = ({
  onChange,
  initialContent,
  taskId,
  taskName,
}: EditorProps) => {
  const isInitializing = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse initial content to proper format
  const initialBlocks = useMemo(() => {
    if (!initialContent) return undefined;

    try {
      return JSON.parse(initialContent);
    } catch {
      // If it's not JSON, it might be markdown - we'll handle this in the editor
      return undefined;
    }
  }, [initialContent]);

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialBlocks,
  });

  // Handle markdown initial content if JSON parsing failed
  useEffect(() => {
    if (initialContent && !initialBlocks && !isInitializing.current) {
      isInitializing.current = true;
      const parseMarkdown = async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
          editor.replaceBlocks(editor.document, blocks);
        } catch (error) {
          console.error("Failed to parse initial content:", error);
        } finally {
          isInitializing.current = false;
        }
      };
      parseMarkdown();
    }
  }, [initialContent, initialBlocks, editor]);

  // Debounced onChange handler to prevent excessive calls
  const handleChange = useCallback(() => {
    if (isInitializing.current) return;

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced update
    debounceTimeoutRef.current = setTimeout(() => {
      const content = JSON.stringify(editor.document, null, 2);
      onChange(content);
    }, 500); // 500ms debounce delay
  }, [editor, onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-2 items-center">
      <div className="relative mt-1 mb-[15px] bl:px-[10px] bbl:px-[0px] flex flex-col gap-4 border-t pt-2 w-[70%]">
        <BlockNoteView
          //Editor width
          className="main-editor w-full"
          editor={editor}
          theme={"light"}
          formattingToolbar={false}
          onChange={handleChange}
        >
          <FormattingToolbarController
            formattingToolbar={() => (
              <FormattingToolbar>
                {getFormattingToolbarItems()}
              </FormattingToolbar>
            )}
          />
        </BlockNoteView>
      </div>
      <div className="w-full max-w-[70%]">
        {/* <NewCommentPanel taskId={taskId} taskName={taskName} /> */}
      </div>
    </div>
  );
};

export default Editor;
