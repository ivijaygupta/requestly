// Chat messages list component with auto-scroll

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { useChatStore, selectMessages, selectIsProcessing } from "./hooks/useChatStore";
import { cn } from "../lib/utils";
import { LOADING_MESSAGES } from "./constants";
import type { AIAction } from "./types";

interface ChatMessagesProps {
  onApplyAction?: (action: AIAction) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ onApplyAction }) => {
  const messages = useChatStore(selectMessages);
  const isProcessing = useChatStore(selectIsProcessing);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Smooth scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isProcessing]);

  // Get a random loading message
  const loadingMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

  return (
    <div
      ref={containerRef}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden", "bg-[#141414]")}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#333 transparent",
      }}
    >
      <div className="flex flex-col py-3 gap-0.5">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onApplyAction={onApplyAction} />
        ))}

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex w-full gap-3 px-4 py-2.5 justify-start">
            <div className="flex-shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600">
                <LoaderIcon className="h-3.5 w-3.5 text-white animate-spin" />
              </div>
            </div>
            <div className="bg-[#1e1e1e] text-[#888] border border-[#2a2a2a] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px]">{loadingMessage}</span>
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Typing dots animation
const TypingDots: React.FC = () => (
  <div className="flex gap-0.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1 h-1 bg-[#555] rounded-full animate-pulse"
        style={{ animationDelay: `${i * 200}ms` }}
      />
    ))}
  </div>
);

// Loader icon
const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
