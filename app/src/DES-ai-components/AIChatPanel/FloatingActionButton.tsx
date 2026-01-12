// Floating Action Button (FAB) to trigger AI Chat Panel

import React, { useEffect, useState } from "react";
import { useChatStore, selectIsOpen } from "./hooks/useChatStore";
import { KEYBOARD_SHORTCUT } from "./constants";

export const FloatingActionButton: React.FC = () => {
  const isOpen = useChatStore(selectIsOpen);
  const togglePanel = useChatStore((state) => state.togglePanel);
  const messages = useChatStore((state) => state.messages);
  const [isHovered, setIsHovered] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Track new messages for badge
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setHasNewMessage(true);
      }
    }
  }, [messages, isOpen]);

  // Clear badge when panel opens
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed =
        (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === KEYBOARD_SHORTCUT.key;

      if (isModifierPressed) {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePanel]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9990,
        transition: "all 300ms ease-out",
        opacity: isOpen ? 0 : 1,
        pointerEvents: isOpen ? "none" : "auto",
        transform: isOpen ? "translateX(16px)" : "translateX(0)",
      }}
    >
      {/* Tooltip */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          right: 0,
          marginBottom: 8,
          padding: "6px 12px",
          borderRadius: 8,
          backgroundColor: "rgb(39, 39, 42)",
          border: "1px solid rgb(63, 63, 70)",
          fontSize: 12,
          color: "rgb(228, 228, 231)",
          whiteSpace: "nowrap",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
          transition: "all 200ms ease-out",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateY(0)" : "translateY(4px)",
          pointerEvents: isHovered ? "auto" : "none",
        }}
      >
        <span>AI Assistant</span>
        <span style={{ marginLeft: 8, color: "rgb(113, 113, 122)" }}>
          {KEYBOARD_SHORTCUT.displayText}
        </span>
        {/* Tooltip arrow */}
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 16,
            border: "4px solid transparent",
            borderTopColor: "rgb(39, 39, 42)",
          }}
        />
      </div>

      {/* FAB Button */}
      <button
        onClick={togglePanel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(to bottom right, rgb(124, 58, 237), rgb(79, 70, 229))",
          boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)",
          border: "none",
          cursor: "pointer",
          transition: "all 200ms ease-out",
        }}
        aria-label="Open AI Assistant"
      >
        {/* Icon */}
        <SparklesIcon
          style={{
            width: 24,
            height: 24,
            color: "white",
            transition: "transform 300ms ease-out",
          }}
        />

        {/* New message badge */}
        {hasNewMessage && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "rgb(16, 185, 129)",
              border: "2px solid rgb(24, 24, 27)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                backgroundColor: "white",
                borderRadius: "50%",
              }}
            />
          </span>
        )}
      </button>
    </div>
  );
};

// Sparkles icon
const SparklesIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
  </svg>
);
