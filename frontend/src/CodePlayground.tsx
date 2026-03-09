import React from "react";
import Editor from "@monaco-editor/react";
import { exerciseEntries, ExerciseEntry } from "./exerciseData";

interface Props {
  onClose: () => void;
}

export default function CodePlayground({ onClose }: Props) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [showSolution, setShowSolution] = React.useState(false);
  const [userCode, setUserCode] = React.useState<Record<string, string>>({});
  const [copied, setCopied] = React.useState(false);
  const viewerRef = React.useRef<HTMLDivElement>(null);

  const entry: ExerciseEntry = exerciseEntries[selectedIdx];
  const currentCode = showSolution
    ? entry.solution
    : userCode[entry.id] ?? entry.exercise;

  const handleEditorChange = (value: string | undefined) => {
    if (!showSolution && value !== undefined) {
      setUserCode((prev) => ({ ...prev, [entry.id]: value }));
    }
  };

  const handleSelectExercise = (idx: number) => {
    setSelectedIdx(idx);
    setShowSolution(false);
  };

  const handleReset = () => {
    setUserCode((prev) => {
      const next = { ...prev };
      delete next[entry.id];
      return next;
    });
    setShowSolution(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
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

  return (
    <div
      className="lesson-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Code Playground"
    >
      <div
        className="playground-viewer"
        onClick={(e) => e.stopPropagation()}
        ref={viewerRef}
      >
        {/* Header */}
        <div className="playground-header">
          <div className="demo-header-left">
            <span className="lesson-module-badge">CODE</span>
            <span className="lesson-module-name">Exercise Playground</span>
          </div>
          <div className="playground-actions">
            <button
              className={`pg-btn ${showSolution ? "pg-btn-active" : ""}`}
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? "Hide Solution" : "Show Solution"}
            </button>
            <button className="pg-btn" onClick={handleReset} disabled={!isEdited && !showSolution}>
              Reset
            </button>
            <button className="pg-btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <button
            className="lesson-close"
            onClick={onClose}
            aria-label="Close playground"
          >
            &times;
          </button>
        </div>

        <div className="playground-body">
          {/* Sidebar - Exercise list */}
          <div className="playground-sidebar">
            <div className="demo-steps-title">Exercises (18)</div>
            {exerciseEntries.map((ex, idx) => (
              <button
                key={ex.id}
                className={`playground-ex-btn ${idx === selectedIdx ? "playground-ex-active" : ""}`}
                onClick={() => handleSelectExercise(idx)}
              >
                <span className="playground-ex-num">{ex.id.replace(/^0+/, "") || "0"}</span>
                <span className="playground-ex-label">{ex.title}</span>
              </button>
            ))}
          </div>

          {/* Editor area */}
          <div className="playground-editor-area">
            {/* Info bar */}
            <div className="playground-info">
              <span className="playground-info-title">{entry.title}</span>
              <div className="playground-info-badges">
                <span className="playground-badge">{todoCount} TODOs</span>
                <span className="playground-badge">
                  {entry.language === "sol" ? "Solidity" : "TypeScript"}
                </span>
                {showSolution && (
                  <span className="playground-badge playground-badge-solution">
                    Viewing Solution
                  </span>
                )}
                {isEdited && !showSolution && (
                  <span className="playground-badge playground-badge-edited">
                    Edited
                  </span>
                )}
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="playground-monaco">
              <Editor
                height="100%"
                language={entry.language === "sol" ? "sol" : "typescript"}
                value={currentCode}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  readOnly: showSolution,
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
            </div>

            {/* Footer hint */}
            <div className="playground-footer-hint">
              Fill in the TODO sections, then click "Show Solution" to compare
              your answer. Use "Copy Code" to paste into Remix IDE for testing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
