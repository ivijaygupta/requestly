// Chat input component with suggestions

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "../lib/utils";
import { useChatStore, selectIsProcessing } from "./hooks/useChatStore";
import { DEFAULT_SUGGESTIONS } from "./constants";
import type { ChatSuggestion } from "./types";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState("");
  const isProcessing = useChatStore(selectIsProcessing);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messages = useChatStore((state) => state.messages);

  // Show suggestions only when there's only the welcome message
  const shouldShowSuggestions = messages.length <= 1 && !inputValue.trim();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !isProcessing) {
      onSendMessage(trimmedValue);
      setInputValue("");
    }
  }, [inputValue, isProcessing, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSuggestionClick = (suggestion: ChatSuggestion) => {
    setInputValue(suggestion.prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-[#252525] bg-[#161616]">
      {/* Suggestions */}
      {shouldShowSuggestions && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-[11px] font-medium text-[#666] mb-2.5 uppercase tracking-wide">Quick actions</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md",
                  "bg-[#1e1e1e] border border-[#2a2a2a]",
                  "text-[11px] text-[#999]",
                  "hover:bg-[#252525] hover:border-[#333] hover:text-[#ccc]",
                  "transition-all duration-150",
                  "focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                )}
              >
                <SuggestionIcon type={suggestion.icon} />
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 pt-3">
        <div
          className={cn(
            "flex items-end gap-2 rounded-lg",
            "bg-[#1a1a1a] border border-[#2a2a2a]",
            "focus-within:border-[#404040] focus-within:bg-[#1c1c1c]",
            "transition-all duration-150"
          )}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {}}
            placeholder="Ask me to create a request, explain an error..."
            disabled={isProcessing}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent",
              "px-3.5 py-2.5 text-[13px] text-[#e0e0e0]",
              "placeholder:text-[#555]",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing}
            className={cn(
              "flex-shrink-0 p-2 m-1.5 rounded-md",
              "bg-violet-600",
              "text-white",
              "hover:bg-violet-500",
              "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-violet-600",
              "transition-all duration-150",
              "focus:outline-none focus:ring-1 focus:ring-violet-400"
            )}
          >
            {isProcessing ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </button>
        </div>

        {/* Hint text */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <span className="text-[10px] text-[#444]">
            <kbd className="px-1 py-0.5 rounded text-[9px] bg-[#222] text-[#666] font-mono border border-[#333]">
              Enter
            </kbd>
            <span className="mx-1">to send</span>
            <span className="text-[#333]">·</span>
            <kbd className="px-1 py-0.5 rounded text-[9px] bg-[#222] text-[#666] font-mono border border-[#333] ml-1">
              Shift+Enter
            </kbd>
            <span className="ml-1">for new line</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Suggestion icon component
const SuggestionIcon: React.FC<{ type?: string }> = ({ type }) => {
  switch (type) {
    case "plus":
      return <PlusIcon className="h-3 w-3" />;
    case "folder":
      return <FolderIcon className="h-3 w-3" />;
    case "help":
      return <HelpIcon className="h-3 w-3" />;
    default:
      return <SparklesIcon className="h-3 w-3" />;
  }
};

// Icons
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

const HelpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);
