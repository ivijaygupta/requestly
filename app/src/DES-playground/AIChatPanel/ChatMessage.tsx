// Individual chat message bubble component

import React, { useState } from "react";
import { cn } from "../lib/utils";
import type { ChatMessage as ChatMessageType, AIAction } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
  onApplyAction?: (action: AIAction) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onApplyAction }) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [isApplied, setIsApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const isActionable =
    message.action &&
    (message.action.type === "create_collection" || message.action.type === "create_request") &&
    message.action.status === "completed";

  const handleApplyAction = async () => {
    if (!message.action || isApplied || isApplying || !onApplyAction) return;
    setIsApplying(true);
    try {
      await onApplyAction(message.action);
      setIsApplied(true);
    } catch (err) {
      console.error("[AI Chat] Failed to apply action:", err);
    } finally {
      setIsApplying(false);
    }
  };

  // Tighter spacing: less padding around rows and inside bubbles
  return (
    <div
      className={cn(
        "flex w-full gap-2 px-3 py-1",
        isUser ? "justify-end" : "justify-start",
        message.isLoading && "animate-pulse"
      )}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#680cb7]">
            <SparklesIcon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Message bubble: reduced padding for tighter internal spacing */}
      <div
        className={cn(
          "max-w-[88%] rounded-lg",
          "px-3 py-2",
          isUser ? "bg-[#004eeb] text-white" : "bg-[#212121] text-[#ffffff] border border-[#383838]",
          isSystem && "bg-amber-900/20 border-amber-700/30 text-amber-200"
        )}
      >
        <div className="text-[12px] leading-[18px] whitespace-pre-wrap font-normal">
          <MessageContent content={message.content} isUser={isUser} />
        </div>

        {/* Action status: reduced spacing from content */}
        {message.action && (
          <div className="mt-2 pt-2 border-t border-[#383838]">
            <ActionStatus action={message.action} />
          </div>
        )}

        {/* Add to Collections / Add Request to Sidebar: primary color */}
        {isActionable && onApplyAction && (
          <div className="mt-2 pt-2 border-t border-[#383838]">
            <button
              onClick={handleApplyAction}
              disabled={isApplied || isApplying}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-medium w-full justify-center",
                "transition-all duration-200",
                isApplied
                  ? "bg-[#0d1f11] text-[#6fdaa6] border border-[#104b2f] cursor-default"
                  : isApplying
                  ? "bg-[#111a2c] text-[#97c3fd] border border-[#001f88] cursor-wait"
                  : "bg-[#004eeb] text-white hover:opacity-90 cursor-pointer active:scale-[0.98]"
              )}
            >
              {isApplied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>Added to Collections</span>
                </>
              ) : isApplying ? (
                <>
                  <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>
                    {message.action?.type === "create_collection"
                      ? "Add Collection to Sidebar"
                      : "Add Request to Sidebar"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className={cn("mt-1.5 text-[11px] leading-[17px]", isUser ? "text-white/50" : "text-[#8f8f8f]")}>
          {formatTime(message.timestamp)}
        </div>
      </div>
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
                isUser ? "bg-white/20 text-white" : "bg-[#282828] text-[#4dcc8f]"
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
                  {i > 0 && <span className={isUser ? "text-white/60" : "text-[#639ff9]"}>•</span>}
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

// Action status indicator (shows step during execution for thought process)
const ActionStatus: React.FC<{ action: ChatMessageType["action"] }> = ({ action }) => {
  if (!action) return null;

  const statusConfig = {
    pending: { label: "Pending", color: "text-[#8f8f8f]", icon: ClockIcon },
    executing: {
      label: action.step ?? "Executing…",
      color: "text-[#e09400]",
      icon: LoaderIcon,
    },
    completed: { label: "Completed", color: "text-[#0baa60]", icon: CheckIcon },
    failed: { label: "Failed", color: "text-[#dc2626]", icon: XIcon },
  };

  const config = statusConfig[action.status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5 text-[11px] leading-[17px]", config.color)}>
      <Icon className={cn("h-3 w-3 flex-shrink-0", action.status === "executing" && "animate-spin")} />
      <span>{config.label}</span>
      {action.type && action.status !== "executing" && (
        <span className="text-[#8f8f8f]">· {action.type.replace(/_/g, " ")}</span>
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

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
