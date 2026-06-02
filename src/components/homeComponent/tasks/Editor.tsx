"use client";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  newTask?: boolean;
}

const Editor = ({ onChange, initialContent, newTask }: EditorProps) => {
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as any[])
      : undefined,
  });

  return (
    <div
      className={`w-full my-[6px] mb-[15px] ${
        newTask === true ? "px-[10px]" : "px-[0px]"
      } mt-[10px]`}
    >
      <BlockNoteView
        editor={editor}
        theme={"light"}
        onChange={() => {
          onChange(JSON.stringify(editor.document, null, 2));
        }}
      />
    </div>
  );
};

export default Editor;
