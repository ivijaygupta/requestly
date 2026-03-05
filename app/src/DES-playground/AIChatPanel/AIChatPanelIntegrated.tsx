// Integrated AI Chat Panel - Part of the UI instead of overlay

import React, { useCallback, useEffect } from "react";
import { cn } from "../lib/utils";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatStore, selectIsOpen } from "./hooks/useChatStore";
import { KEYBOARD_SHORTCUT } from "./constants";

import type { AIAction } from "./types";

interface AIChatPanelIntegratedProps {
  onSendMessage: (message: string) => void;
  onApplyAction?: (action: AIAction) => void;
}

/**
 * Integrated AI Chat Panel that appears as part of the UI layout
 * instead of as an overlay. Designed to be placed in a split layout.
 */
export const AIChatPanelIntegrated: React.FC<AIChatPanelIntegratedProps> = ({ onSendMessage, onApplyAction }) => {
  const isOpen = useChatStore(selectIsOpen);
  const closePanel = useChatStore((state) => state.closePanel);
  const togglePanel = useChatStore((state) => state.togglePanel);
  const clearMessages = useChatStore((state) => state.clearMessages);

  // Handle keyboard shortcut for toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === KEYBOARD_SHORTCUT.key;

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

  // Panel: Figma spacing 8px grid; border #383838; bg #141414 / #212121
  return (
    <div
      className={cn("flex flex-col h-full w-full", "bg-[#141414] border-l border-[#383838]")}
      style={{ minWidth: "380px" }}
    >
      {/* Header: 16px h padding, 12px v padding, border-bottom #383838 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#383838] bg-[#212121]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#680cb7]">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-base font-medium leading-[22px] text-[#ffffff]">Requestly AI</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className={cn(
              "p-2 rounded-md",
              "text-[#8f8f8f] hover:text-[#bbbbbb]",
              "hover:bg-[#282828]",
              "transition-colors duration-150"
            )}
            title="Clear chat"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            onClick={closePanel}
            className={cn(
              "p-2 rounded-md",
              "text-[#8f8f8f] hover:text-[#bbbbbb]",
              "hover:bg-[#282828]",
              "transition-colors duration-150"
            )}
            title="Close (Esc)"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <ChatMessages onApplyAction={onApplyAction} />

      {/* Input area */}
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
};

// Icons
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
