"use client";

import dynamic from "next/dynamic";
import React from "react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  minHeight?: string;
}

const Monaco = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full min-h-[160px] p-3 rounded-md border border-[var(--border)] bg-[var(--surface-3)] font-mono text-xs text-[var(--ink-3)] flex items-center justify-center">
        Loading Monaco editor...
      </div>
    ),
  }
);

export function MonacoEditor({
  value,
  onChange,
  language = "json",
  readOnly = false,
  height = "100%",
  minHeight = "200px",
}: MonacoEditorProps) {
  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme("mocklab-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "F2F5E9", background: "171A10" },
        { token: "string.key.json", foreground: "BFFF3C" },
        { token: "string.value.json", foreground: "A8B09A" },
        { token: "number", foreground: "67E8F9" },
        { token: "keyword.json", foreground: "FACC15" },
      ],
      colors: {
        "editor.background": "#171A10",
        "editor.foreground": "#F2F5E9",
        "editor.lineHighlightBackground": "#1F2318",
        "editorCursor.foreground": "#BFFF3C",
        "editorLineNumber.foreground": "#6E7663",
        "editorLineNumber.activeForeground": "#BFFF3C",
        "editorIndentGuide.background1": "#2A2E22",
        "editorIndentGuide.activeBackground1": "#3D4232",
      },
    });
  };

  return (
    <div
      className="w-full rounded-md border border-[var(--border)] overflow-hidden bg-[var(--surface-1)]"
      style={{ minHeight, height }}
    >
      <Monaco
        height={height}
        language={language}
        value={value}
        theme="mocklab-dark"
        beforeMount={handleEditorWillMount}
        onChange={(val) => onChange(val || "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 12,
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          renderLineHighlight: "all",
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
