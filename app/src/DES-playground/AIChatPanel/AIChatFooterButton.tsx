// AI Chat Footer Button - Styled to match the app footer design

import React from "react";
import { useChatStore, selectIsOpen, selectHasUnread } from "./hooks/useChatStore";
import { cn } from "../lib/utils";

/**
 * Footer-style button for AI Chat that matches the app footer design.
 * Displays as a text link with an icon, consistent with "Documentation" and "Help" links.
 */
export const AIChatFooterButton: React.FC = () => {
  const isOpen = useChatStore(selectIsOpen);
  const hasUnread = useChatStore(selectHasUnread);
  const togglePanel = useChatStore((state) => state.togglePanel);
  const markAsRead = useChatStore((state) => state.markAsRead);

  const handleClick = () => {
    togglePanel();
    if (hasUnread) {
      markAsRead();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-3.5 py-0",
        "text-[13px] font-normal",
        "cursor-pointer",
        "border-r border-[#383838]",
        "transition-colors duration-150",
        "bg-transparent",
        isOpen ? "text-[#ffffff]" : "text-[#8f8f8f] hover:text-[#ffffff]"
      )}
      style={{
        fontFamily: "inherit",
        lineHeight: "inherit",
      }}
    >
      <SparklesIcon className="h-3.5 w-3.5" />
      <span>Requestly AI</span>
      {hasUnread && <span className="flex h-1.5 w-1.5 rounded-full bg-[#004eeb]" />}
    </button>
  );
};

// Sparkles icon for AI
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

export default AIChatFooterButton;
