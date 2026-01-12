// Main AI Chat Panel component - Sliding panel from right

import React, { useCallback, useEffect } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatStore, selectIsOpen } from "./hooks/useChatStore";
import { CHAT_PANEL_WIDTH, KEYBOARD_SHORTCUT } from "./constants";

interface AIChatPanelProps {
  onSendMessage: (message: string) => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ onSendMessage }) => {
  const isOpen = useChatStore(selectIsOpen);
  const closePanel = useChatStore((state) => state.closePanel);
  const togglePanel = useChatStore((state) => state.togglePanel);
  const clearMessages = useChatStore((state) => state.clearMessages);

  // Handle keyboard shortcut for toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed =
        (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === KEYBOARD_SHORTCUT.key;

      if (isModifierPressed) {
        e.preventDefault();
        togglePanel();
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        closePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, togglePanel, closePanel]);

  const handleClearChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          transition: "opacity 300ms ease-out",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={closePanel}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: CHAT_PANEL_WIDTH,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(24, 24, 27, 0.95)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgb(39, 39, 42)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          transition: "transform 300ms ease-out",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid rgb(39, 39, 42)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                height: 32,
                width: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: "linear-gradient(to bottom right, rgb(139, 92, 246), rgb(79, 70, 229))",
                boxShadow: "0 4px 6px -1px rgba(139, 92, 246, 0.2)",
              }}
            >
              <SparklesIcon style={{ width: 16, height: 16, color: "white" }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "rgb(244, 244, 245)",
                  margin: 0,
                }}
              >
                AI Assistant
              </h2>
              <p
                style={{
                  fontSize: 10,
                  color: "rgb(113, 113, 122)",
                  margin: 0,
                }}
              >
                Powered by Requestly
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Clear chat button */}
            <button
              onClick={handleClearChat}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: "transparent",
                border: "none",
                color: "rgb(161, 161, 170)",
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
              title="Clear chat"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgb(39, 39, 42)";
                e.currentTarget.style.color = "rgb(228, 228, 231)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgb(161, 161, 170)";
              }}
            >
              <TrashIcon style={{ width: 16, height: 16 }} />
            </button>
            {/* Close button */}
            <button
              onClick={closePanel}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: "transparent",
                border: "none",
                color: "rgb(161, 161, 170)",
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
              title="Close (Esc)"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgb(39, 39, 42)";
                e.currentTarget.style.color = "rgb(228, 228, 231)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgb(161, 161, 170)";
              }}
            >
              <CloseIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <ChatMessages />

        {/* Input area */}
        <ChatInput onSendMessage={onSendMessage} />

        {/* Keyboard shortcut hint */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(39, 39, 42, 0.5)",
            backgroundColor: "rgba(9, 9, 11, 0.5)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "rgb(82, 82, 91)",
              textAlign: "center",
              margin: 0,
            }}
          >
            <kbd
              style={{
                padding: "2px 4px",
                borderRadius: 4,
                backgroundColor: "rgb(39, 39, 42)",
                color: "rgb(161, 161, 170)",
                fontFamily: "monospace",
                fontSize: 9,
              }}
            >
              {KEYBOARD_SHORTCUT.displayText}
            </kbd>{" "}
            to toggle
          </p>
        </div>
      </div>
    </>
  );
};

// Icons
const SparklesIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const CloseIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const TrashIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
