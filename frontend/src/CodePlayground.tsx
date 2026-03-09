import React from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { exerciseEntries, ExerciseEntry } from "./exerciseData";

/* ── localStorage keys ── */
const STORAGE_CODE = "fhevm-playground-code";
const STORAGE_DONE = "fhevm-playground-done";

/* ── Solidity language definition for Monaco ── */
function registerSolidity(monaco: typeof import("monaco-editor")) {
  if (monaco.languages.getLanguages().some((l) => l.id === "solidity")) return;

  monaco.languages.register({ id: "solidity" });

  monaco.languages.setMonarchTokensProvider("solidity", {
    keywords: [
      "pragma",
      "solidity",
      "import",
      "contract",
      "library",
      "interface",
      "is",
      "function",
      "modifier",
      "event",
      "struct",
      "enum",
      "mapping",
      "public",
      "private",
      "internal",
      "external",
      "pure",
      "view",
      "payable",
      "memory",
      "storage",
      "calldata",
      "returns",
      "return",
      "if",
      "else",
      "for",
      "while",
      "do",
      "break",
      "continue",
      "throw",
      "emit",
      "require",
      "assert",
      "revert",
      "constructor",
      "fallback",
      "receive",
      "virtual",
      "override",
      "abstract",
      "using",
      "delete",
      "new",
      "try",
      "catch",
      "unchecked",
      "assembly",
      "constant",
      "immutable",
      "indexed",
      "anonymous",
    ],
    typeKeywords: [
      "address",
      "bool",
      "string",
      "bytes",
      "byte",
      "uint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "uint128",
      "uint256",
      "int",
      "int8",
      "int16",
      "int32",
      "int64",
      "int128",
      "int256",
      "bytes1",
      "bytes2",
      "bytes4",
      "bytes8",
      "bytes16",
      "bytes32",
      "euint8",
      "euint16",
      "euint32",
      "euint64",
      "euint128",
      "euint256",
      "ebool",
      "eaddress",
      "ebytes64",
      "ebytes128",
      "ebytes256",
      "externalEuint8",
      "externalEuint16",
      "externalEuint32",
      "externalEuint64",
      "externalEuint128",
      "externalEuint256",
      "externalEbool",
      "externalEaddress",
    ],
    operators: [
      "=",
      ">",
      "<",
      "!",
      "~",
      "?",
      ":",
      "==",
      "<=",
      ">=",
      "!=",
      "&&",
      "||",
      "++",
      "--",
      "+",
      "-",
      "*",
      "/",
      "&",
      "|",
      "^",
      "%",
      "<<",
      ">>",
      "+=",
      "-=",
      "*=",
      "/=",
      "&=",
      "|=",
      "^=",
      "%=",
      "<<=",
      ">>=",
      "=>",
    ],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    tokenizer: {
      root: [
        [/\/\/\/.*$/, "comment.doc"],
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/\b(FHE)\b/, "type.identifier"],
        [/\b(msg|block|tx)\b/, "variable.predefined"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
        [/\b0[xX][0-9a-fA-F]+\b/, "number.hex"],
        [/\b\d+\b/, "number"],
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              "@typeKeywords": "type",
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],
        [/[{}()[\]]/, "@brackets"],
        [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],
        [/[;,.]/, "delimiter"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  });

  // Solidity-specific dark theme
  monaco.editor.defineTheme("solidity-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "c678dd", fontStyle: "bold" },
      { token: "type", foreground: "e5c07b" },
      { token: "type.identifier", foreground: "61afef", fontStyle: "bold" },
      { token: "variable.predefined", foreground: "e06c75" },
      { token: "comment", foreground: "5c6370", fontStyle: "italic" },
      { token: "comment.doc", foreground: "7c8da0", fontStyle: "italic" },
      { token: "string", foreground: "98c379" },
      { token: "number", foreground: "d19a66" },
      { token: "number.hex", foreground: "d19a66" },
      { token: "operator", foreground: "56b6c2" },
      { token: "delimiter", foreground: "abb2bf" },
      { token: "identifier", foreground: "abb2bf" },
    ],
    colors: {
      "editor.background": "#1e1e2e",
      "editor.foreground": "#cdd6f4",
      "editorLineNumber.foreground": "#585b70",
      "editorLineNumber.activeForeground": "#a6adc8",
      "editor.selectionBackground": "#45475a",
      "editor.lineHighlightBackground": "#313244",
    },
  });
}

/* ── Helpers ── */
function loadSavedCode(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_CODE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCodes(codes: Record<string, string>) {
  localStorage.setItem(STORAGE_CODE, JSON.stringify(codes));
}

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DONE);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompleted(done: Set<string>) {
  localStorage.setItem(STORAGE_DONE, JSON.stringify([...done]));
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: "#a6e3a1", text: "#1e1e2e", label: "Beginner" },
  intermediate: { bg: "#f9e2af", text: "#1e1e2e", label: "Intermediate" },
  advanced: { bg: "#f38ba8", text: "#1e1e2e", label: "Advanced" },
};

/* ── Component ── */
interface Props {
  onClose: () => void;
}

type ViewMode = "edit" | "solution" | "diff";

export default function CodePlayground({ onClose }: Props) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<ViewMode>("edit");
  const [userCode, setUserCode] = React.useState<Record<string, string>>(loadSavedCode);
  const [completed, setCompleted] = React.useState<Set<string>>(loadCompleted);
  const [copied, setCopied] = React.useState(false);
  const [showHints, setShowHints] = React.useState(false);
  const [revealedHints, setRevealedHints] = React.useState(0);
  const viewerRef = React.useRef<HTMLDivElement>(null);

  const entry: ExerciseEntry = exerciseEntries[selectedIdx];
  const currentCode =
    viewMode === "solution" ? entry.solution : (userCode[entry.id] ?? entry.exercise);

  // Register Solidity on Monaco mount
  const handleEditorWillMount = (monaco: typeof import("monaco-editor")) => {
    registerSolidity(monaco);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (viewMode === "edit" && value !== undefined) {
      const next = { ...userCode, [entry.id]: value };
      setUserCode(next);
      saveCodes(next);
    }
  };

  const handleSelectExercise = (idx: number) => {
    setSelectedIdx(idx);
    setViewMode("edit");
    setShowHints(false);
    setRevealedHints(0);
  };

  const handleReset = () => {
    const next = { ...userCode };
    delete next[entry.id];
    setUserCode(next);
    saveCodes(next);
    setViewMode("edit");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const handleMarkComplete = () => {
    const next = new Set(completed);
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }
    setCompleted(next);
    saveCompleted(next);
  };

  // Keyboard: Escape to close
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Count TODOs in current exercise
  const todoCount = (entry.exercise.match(/TODO/g) || []).length;
  const isEdited = userCode[entry.id] !== undefined;
  const isComplete = completed.has(entry.id);
  const completedCount = completed.size;
  const totalCount = exerciseEntries.length;
  const diff = entry.difficulty as keyof typeof DIFFICULTY_COLORS;
  const diffStyle = DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.beginner;
  const editorLang = entry.language === "sol" ? "solidity" : "typescript";

  return (
    <div
      className="lesson-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Code Playground"
    >
      <div className="playground-viewer" onClick={(e) => e.stopPropagation()} ref={viewerRef}>
        {/* Header */}
        <div className="playground-header">
          <div className="demo-header-left">
            <span className="lesson-module-badge">CODE</span>
            <span className="lesson-module-name">Exercise Playground</span>
            <span className="pg-progress">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="playground-actions">
            <button
              className={`pg-btn ${viewMode === "edit" ? "pg-btn-active" : ""}`}
              onClick={() => setViewMode("edit")}
            >
              Edit
            </button>
            <button
              className={`pg-btn ${viewMode === "solution" ? "pg-btn-active" : ""}`}
              onClick={() => setViewMode(viewMode === "solution" ? "edit" : "solution")}
            >
              Solution
            </button>
            <button
              className={`pg-btn ${viewMode === "diff" ? "pg-btn-active" : ""}`}
              onClick={() => setViewMode(viewMode === "diff" ? "edit" : "diff")}
              disabled={!isEdited}
              title={
                !isEdited ? "Edit the exercise first to compare" : "Compare your code with solution"
              }
            >
              Compare
            </button>
            <span className="pg-divider" />
            <button className="pg-btn" onClick={handleReset} disabled={!isEdited}>
              Reset
            </button>
            <button className="pg-btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              className={`pg-btn ${isComplete ? "pg-btn-complete" : ""}`}
              onClick={handleMarkComplete}
              title={isComplete ? "Mark as incomplete" : "Mark as complete"}
            >
              {isComplete ? "\u2713 Done" : "Mark Done"}
            </button>
          </div>
          <button className="lesson-close" onClick={onClose} aria-label="Close playground">
            &times;
          </button>
        </div>

        <div className="playground-body">
          {/* Sidebar - Exercise list */}
          <div className="playground-sidebar">
            <div className="demo-steps-title">Exercises ({totalCount})</div>
            {/* Progress bar */}
            <div className="pg-sidebar-progress">
              <div
                className="pg-sidebar-progress-bar"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            {exerciseEntries.map((ex, idx) => {
              const done = completed.has(ex.id);
              const d = ex.difficulty as keyof typeof DIFFICULTY_COLORS;
              const ds = DIFFICULTY_COLORS[d] || DIFFICULTY_COLORS.beginner;
              return (
                <button
                  key={ex.id}
                  className={`playground-ex-btn ${idx === selectedIdx ? "playground-ex-active" : ""} ${done ? "playground-ex-done" : ""}`}
                  onClick={() => handleSelectExercise(idx)}
                >
                  <span className={`playground-ex-num ${done ? "playground-ex-num-done" : ""}`}>
                    {done ? "\u2713" : ex.id.replace(/^0+/, "") || "0"}
                  </span>
                  <span className="playground-ex-label">
                    {ex.title.replace(/^Exercise \d+:\s*/, "")}
                  </span>
                  <span
                    className="playground-ex-diff"
                    style={{ background: ds.bg, color: ds.text }}
                  >
                    {ds.label.charAt(0)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Editor area */}
          <div className="playground-editor-area">
            {/* Info bar */}
            <div className="playground-info">
              <div className="playground-info-left">
                <span className="playground-info-title">{entry.title}</span>
                {entry.description && (
                  <span className="playground-info-desc">{entry.description}</span>
                )}
              </div>
              <div className="playground-info-badges">
                <span
                  className="playground-badge"
                  style={{ background: diffStyle.bg, color: diffStyle.text }}
                >
                  {diffStyle.label}
                </span>
                <span className="playground-badge">{todoCount} TODOs</span>
                <span className="playground-badge">
                  {entry.language === "sol" ? "Solidity" : "TypeScript"}
                </span>
                {viewMode === "solution" && (
                  <span className="playground-badge playground-badge-solution">
                    Viewing Solution
                  </span>
                )}
                {viewMode === "diff" && (
                  <span className="playground-badge playground-badge-solution">Comparing</span>
                )}
                {isEdited && viewMode === "edit" && (
                  <span className="playground-badge playground-badge-edited">Edited</span>
                )}
              </div>
            </div>

            {/* Hints panel */}
            {entry.hints.length > 0 && (
              <div className="playground-hints">
                <button
                  className="playground-hints-toggle"
                  onClick={() => {
                    setShowHints(!showHints);
                    if (!showHints) setRevealedHints(0);
                  }}
                >
                  {showHints ? "Hide Hints" : `Show Hints (${entry.hints.length})`}
                </button>
                {showHints && (
                  <div className="playground-hints-list">
                    {entry.hints.slice(0, revealedHints + 1).map((h, i) => (
                      <div key={i} className="playground-hint-item">
                        <span className="playground-hint-num">Hint {i + 1}:</span> {h}
                      </div>
                    ))}
                    {revealedHints + 1 < entry.hints.length && (
                      <button
                        className="playground-hints-more"
                        onClick={() => setRevealedHints((p) => p + 1)}
                      >
                        Reveal next hint...
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Monaco Editor / Diff Editor */}
            <div className="playground-monaco">
              {viewMode === "diff" ? (
                <DiffEditor
                  height="100%"
                  language={editorLang}
                  original={userCode[entry.id] ?? entry.exercise}
                  modified={entry.solution}
                  theme="solidity-dark"
                  beforeMount={handleEditorWillMount}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                    padding: { top: 12 },
                    renderSideBySide: true,
                    originalEditable: false,
                  }}
                />
              ) : (
                <Editor
                  height="100%"
                  language={editorLang}
                  value={currentCode}
                  onChange={handleEditorChange}
                  theme="solidity-dark"
                  beforeMount={handleEditorWillMount}
                  options={{
                    readOnly: viewMode === "solution",
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                    padding: { top: 12 },
                    renderWhitespace: "none",
                    tabSize: 4,
                  }}
                />
              )}
            </div>

            {/* Footer hint */}
            <div className="playground-footer-hint">
              Fill in the TODO sections, then click &quot;Compare&quot; to diff your answer against
              the solution. Use &quot;Copy&quot; to paste into Remix IDE for on-chain testing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
