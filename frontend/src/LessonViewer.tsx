import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { lessons, exercises } from "./lessonData";

const GITHUB_REPO = "https://github.com/Himess/fhevm-bootcamp";

type Tab = "lesson" | "exercise" | "slides";

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
  const [slidesLoading, setSlidesLoading] = React.useState(true);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const lessonContent = lessons[moduleFolder] ?? null;
  const exerciseContent = exercises[moduleFolder] ?? null;
  const content = tab === "lesson" ? lessonContent : tab === "exercise" ? exerciseContent : null;
  const slidesUrl = `/slides/${moduleFolder}.html`;

  // Scroll to top on tab or module change
  React.useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [tab, moduleId]);

  // Reset tab to lesson and slides loading state when module changes
  React.useEffect(() => {
    setTab("lesson");
    setSlidesLoading(true);
  }, [moduleId]);

  // Store previous focus and focus the modal on open
  React.useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // Keyboard handling: Escape, Arrow keys, focus trap
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev) {
        onNavigate("prev");
        return;
      }
      if (e.key === "ArrowRight" && hasNext) {
        onNavigate("next");
        return;
      }
      // Focus trap
      if (e.key === "Tab" && viewerRef.current) {
        const focusable = viewerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate, hasPrev, hasNext]);

  return (
    <div
      className="lesson-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Module ${moduleId}: ${moduleName}`}
    >
      <div className="lesson-viewer" onClick={(e) => e.stopPropagation()} ref={viewerRef}>
        <div className="lesson-header">
          <div className="lesson-header-left">
            <span className="lesson-module-badge">{moduleId}</span>
            <span className="lesson-module-name">{moduleName}</span>
          </div>
          <div className="lesson-tabs" role="tablist" aria-label="Content tabs">
            <button
              className={`lesson-tab ${tab === "lesson" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("lesson")}
              role="tab"
              aria-selected={tab === "lesson"}
              aria-controls="lesson-content"
            >
              Lesson
            </button>
            <button
              className={`lesson-tab ${tab === "exercise" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("exercise")}
              role="tab"
              aria-selected={tab === "exercise"}
              aria-controls="lesson-content"
            >
              Exercise
            </button>
            <button
              className={`lesson-tab ${tab === "slides" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("slides")}
              role="tab"
              aria-selected={tab === "slides"}
              aria-controls="lesson-content"
            >
              Slides
            </button>
            <a
              className="lesson-tab lesson-tab-link"
              href={`${GITHUB_REPO}/tree/main/modules/${moduleFolder}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source code on GitHub"
            >
              GitHub
            </a>
          </div>
          <button
            className="lesson-close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close lesson viewer"
          >
            &times;
          </button>
        </div>

        <div className="lesson-body" ref={contentRef} id="lesson-content" role="tabpanel">
          {tab === "slides" ? (
            <div className="lesson-slides-container">
              <div className="lesson-slides-wrapper">
                {slidesLoading && (
                  <div className="lesson-slides-loading">
                    <div className="lesson-slides-spinner" />
                    <span>Loading slides...</span>
                  </div>
                )}
                <iframe
                  src={slidesUrl}
                  className="lesson-slides-iframe"
                  title={`Slides for Module ${moduleId}: ${moduleName}`}
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={() => setSlidesLoading(false)}
                />
              </div>
              <div className="lesson-slides-hint">
                <a href={slidesUrl} target="_blank" rel="noopener noreferrer">
                  Open in full screen
                </a>
                {" | Use arrow keys to navigate slides"}
              </div>
            </div>
          ) : content ? (
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
            aria-label="Go to previous module"
          >
            &larr; Previous Module
          </button>
          <span className="lesson-footer-hint">ESC to close | Arrow keys to navigate</span>
          <button
            className="lesson-nav-btn"
            onClick={() => onNavigate("next")}
            disabled={!hasNext}
            aria-label="Go to next module"
          >
            Next Module &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
