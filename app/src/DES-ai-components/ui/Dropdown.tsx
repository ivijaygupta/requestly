import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";

export interface DropdownMenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownMenuItem[];
  placement?: "bottomLeft" | "bottomRight";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, placement = "bottomRight", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const placementClasses = {
    bottomLeft: "left-0 mt-2",
    bottomRight: "right-0 mt-2",
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          (trigger.props as any).onClick?.(e);
        },
      })}

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 min-w-[160px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100",
            placementClasses[placement]
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick?.();
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                "hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed",
                item.danger ? "text-red-400 hover:bg-red-500/10" : "text-zinc-300 hover:text-zinc-100"
              )}
            >
              {item.icon && <span className="flex-shrink-0 text-zinc-500">{item.icon}</span>}
              <span className="flex-1 text-left truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
