import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { lessons, exercises } from "./lessonData";

const GITHUB_REPO = "https://github.com/Himess/fhevm-bootcamp";

type Tab = "lesson" | "exercise";

interface Props {
  moduleId: string;
  moduleName: string;
  moduleFolder: string;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function LessonViewer({
  moduleId,
  moduleName,
  moduleFolder,
  onClose,
  onNavigate,
  hasPrev,
  hasNext,
}: Props) {
  const [tab, setTab] = React.useState<Tab>("lesson");
  const contentRef = React.useRef<HTMLDivElement>(null);

  const lessonContent = lessons[moduleFolder] ?? null;
  const exerciseContent = exercises[moduleFolder] ?? null;
  const content = tab === "lesson" ? lessonContent : exerciseContent;

  // Scroll to top on tab or module change
  React.useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [tab, moduleId]);

  // Reset tab to lesson when module changes
  React.useEffect(() => {
    setTab("lesson");
  }, [moduleId]);

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="lesson-overlay" onClick={onClose}>
      <div className="lesson-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="lesson-header">
          <div className="lesson-header-left">
            <span className="lesson-module-badge">{moduleId}</span>
            <span className="lesson-module-name">{moduleName}</span>
          </div>
          <div className="lesson-tabs">
            <button
              className={`lesson-tab ${tab === "lesson" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("lesson")}
            >
              Lesson
            </button>
            <button
              className={`lesson-tab ${tab === "exercise" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("exercise")}
            >
              Exercise
            </button>
            <a
              className="lesson-tab lesson-tab-link"
              href={`/slides/${moduleFolder}.html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Slides
            </a>
            <a
              className="lesson-tab lesson-tab-link"
              href={`${GITHUB_REPO}/tree/main/modules/${moduleFolder}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
          <button className="lesson-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="lesson-body" ref={contentRef}>
          {content ? (
            <div className="lesson-markdown">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          ) : (
            <div className="lesson-empty">No content available for this tab.</div>
          )}
        </div>

        <div className="lesson-footer">
          <button
            className="lesson-nav-btn"
            onClick={() => onNavigate("prev")}
            disabled={!hasPrev}
          >
            &larr; Previous Module
          </button>
          <span className="lesson-footer-hint">ESC to close</span>
          <button
            className="lesson-nav-btn"
            onClick={() => onNavigate("next")}
            disabled={!hasNext}
          >
            Next Module &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
