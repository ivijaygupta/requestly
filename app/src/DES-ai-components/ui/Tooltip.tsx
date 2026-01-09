import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: "top" | "bottom";
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delay = 200,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const placementClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  };

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-[110] px-2 py-1 text-[11px] font-medium text-zinc-100 bg-zinc-800 border border-zinc-700 rounded shadow-md whitespace-nowrap animate-in fade-in duration-150",
            placementClasses[placement]
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-1.5 h-1.5 bg-zinc-800 border-zinc-700 border-r border-b rotate-45",
              placement === "top"
                ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0"
                : "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l border-r-0 border-b-0"
            )}
          />
        </div>
      )}
    </div>
  );
};
