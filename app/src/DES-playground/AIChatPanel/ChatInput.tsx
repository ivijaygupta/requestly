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

  // Figma: space-4/5/6, body 12px, surface-0 #212121, primary #004eeb, text-placeholder #8f8f8f
  return (
    <div className="border-t border-[#383838] bg-[#1a1a1a]">
      {shouldShowSuggestions && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-[11px] font-medium text-[#8f8f8f] mb-2 uppercase tracking-wide">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md",
                  "bg-[#212121] border border-[#383838]",
                  "text-[11px] leading-[17px] text-[#bbbbbb]",
                  "hover:bg-[#282828] hover:text-[#ffffff]",
                  "transition-all duration-150",
                  "focus:outline-none focus:ring-1 focus:ring-[#004eeb]"
                )}
              >
                <SuggestionIcon type={suggestion.icon} />
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <div
          className={cn(
            "flex items-end gap-2 rounded-lg p-3",
            "bg-[#212121] border border-[#383838]",
            "focus-within:border-[#004eeb]",
            "transition-all duration-150"
          )}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {}}
            placeholder="How do I fetch only new items since last check?"
            disabled={isProcessing}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent",
              "px-0 py-0 text-[12px] leading-[18px] text-[#ffffff]",
              "placeholder:text-[#8f8f8f]",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing}
            className={cn(
              "flex-shrink-0 p-2 rounded-md",
              "bg-[#004eeb] text-white",
              "hover:opacity-90",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "transition-all duration-150",
              "focus:outline-none focus:ring-1 focus:ring-[#004eeb]"
            )}
          >
            {isProcessing ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2 text-[#8f8f8f]">
          <span className="text-[9px] leading-[13px] text-[#8f8f8f] font-medium tracking-wider uppercase">
            <kbd className="px-1.5 py-0.5 rounded bg-[#282828] text-[#bbbbbb] font-mono border border-[#383838]">
              Enter
            </kbd>
            <span className="mx-1">to send</span>
            <span className="text-[#8f8f8f] opacity-70">·</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#282828] text-[#bbbbbb] font-mono border border-[#383838] ml-1">
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
