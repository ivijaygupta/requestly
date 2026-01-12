// Individual chat message bubble component

import React from "react";
import { cn } from "../lib/utils";
import type { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "flex w-full gap-2.5 px-4 py-2",
        isUser ? "justify-end" : "justify-start",
        message.isLoading && "animate-pulse"
      )}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              "bg-violet-600"
            )}
          >
            <SparklesIcon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2",
          isUser
            ? "bg-violet-600 text-white"
            : "bg-[#1e1e1e] text-[#d4d4d4] border border-[#2a2a2a]",
          isSystem && "bg-amber-900/20 border-amber-700/30 text-amber-200"
        )}
      >
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
          <MessageContent content={message.content} isUser={isUser} />
        </div>
        
        {/* Action status indicator */}
        {message.action && (
          <div className="mt-2 pt-2 border-t border-[#333]">
            <ActionStatus action={message.action} />
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "mt-1.5 text-[10px]",
            isUser ? "text-white/40" : "text-[#555]"
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2a2a2a] border border-[#333]">
            <UserIcon className="h-3.5 w-3.5 text-[#888]" />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to render markdown-like content
const MessageContent: React.FC<{ content: string; isUser?: boolean }> = ({ content, isUser }) => {
  // Simple markdown parsing for bold text and code blocks
  const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-medium">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className={cn(
                "rounded px-1 py-0.5 font-mono text-[11px]",
                isUser ? "bg-white/20 text-white" : "bg-[#252525] text-emerald-400"
              )}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        // Handle bullet points
        if (part.includes("•")) {
          return (
            <span key={index}>
              {part.split("•").map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className={isUser ? "text-white/60" : "text-violet-400"}>•</span>}
                  {item}
                </React.Fragment>
              ))}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

// Action status indicator
const ActionStatus: React.FC<{ action: ChatMessageType["action"] }> = ({ action }) => {
  if (!action) return null;

  const statusConfig = {
    pending: { label: "Pending", color: "text-[#666]", icon: ClockIcon },
    executing: { label: "Executing...", color: "text-amber-500", icon: LoaderIcon },
    completed: { label: "Completed", color: "text-emerald-500", icon: CheckIcon },
    failed: { label: "Failed", color: "text-red-500", icon: XIcon },
  };

  const config = statusConfig[action.status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5 text-[11px]", config.color)}>
      <Icon className={cn("h-3 w-3", action.status === "executing" && "animate-spin")} />
      <span>{config.label}</span>
      {action.type && (
        <span className="text-[#555]">
          · {action.type.replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
};

// Helper to format timestamp
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Icon components
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
