// Chat messages list component with auto-scroll

import React, { useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { useChatStore, selectMessages, selectIsProcessing, selectThinkingStep } from "./hooks/useChatStore";
import { cn } from "../lib/utils";
import type { AIAction } from "./types";

interface ChatMessagesProps {
  onApplyAction?: (action: AIAction) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ onApplyAction }) => {
  const messages = useChatStore(selectMessages);
  const isProcessing = useChatStore(selectIsProcessing);
  const thinkingStep = useChatStore(selectThinkingStep);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages or thinking step change
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isProcessing, thinkingStep]);

  // Tighter spacing: 4px gap between messages, 12px vertical padding
  return (
    <div
      ref={containerRef}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden", "bg-[#141414]")}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#383838 transparent",
      }}
    >
      <div className="flex flex-col py-3 gap-1">
        {messages.map((message, index) => (
          <m.div
            key={message.id}
            initial={index === messages.length - 1 && message.role === "assistant" ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-col"
          >
            <ChatMessage message={message} onApplyAction={onApplyAction} />
          </m.div>
        ))}

        {/* Loading / thinking indicator with animated step */}
        {isProcessing && (
          <div className="flex w-full gap-2 px-3 py-1 justify-start">
            <div className="flex-shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#680cb7]">
                <LoaderIcon className="h-3.5 w-3.5 text-white animate-spin" />
              </div>
            </div>
            <div className="bg-[#212121] text-[#bbbbbb] border border-[#383838] rounded-lg px-3 py-2 min-h-[40px] flex items-center">
              <div className="flex items-center gap-2 min-w-0">
                <AnimatePresence mode="wait">
                  <m.span
                    key={thinkingStep ?? "thinking"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className="text-[12px] leading-[18px] block"
                  >
                    {thinkingStep ?? "Thinking…"}
                  </m.span>
                </AnimatePresence>
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
        className="w-1 h-1 bg-[#8f8f8f] rounded-full animate-pulse"
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
