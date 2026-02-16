import React, { useState, useRef, useEffect, useCallback } from "react";
import { MdKeyboardArrowDown } from "@react-icons/all-files/md/MdKeyboardArrowDown";
import { MdClose } from "@react-icons/all-files/md/MdClose";
import { MdCheck } from "@react-icons/all-files/md/MdCheck";
import { cn } from "../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-150",
          "hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
          isOpen && "border-indigo-500 ring-1 ring-indigo-500/50 bg-zinc-900/50",
          error && "border-red-500 focus:ring-red-500/50",
          disabled && "opacity-50 cursor-not-allowed bg-zinc-900"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-zinc-600")}>
          {selectedOption?.label || placeholder}
        </span>
        <MdKeyboardArrowDown
          className={cn("h-4 w-4 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-700 bg-zinc-900 p-1 text-zinc-100 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-start rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors",
                "hover:bg-zinc-800 focus:bg-zinc-800",
                option.value === value && "bg-indigo-500/10 text-indigo-400"
              )}
            >
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="font-medium">{option.label}</span>
                {option.description && <span className="text-xs text-zinc-500 line-clamp-2">{option.description}</span>}
              </div>
              {option.value === value && (
                <span className="absolute right-2 top-2 flex h-3.5 w-3.5 items-center justify-center">
                  <MdCheck className="h-4 w-4" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Multi-select component
export interface MultiSelectProps {
  value?: string[];
  onChange?: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxTagCount?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  maxTagCount = 2,
}) => {
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

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
    onChange?.(newValue);
  };

  const removeTag = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const visibleTags = selectedOptions.slice(0, maxTagCount);
  const hiddenCount = selectedOptions.length - maxTagCount;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex min-h-[36px] w-full items-center justify-between rounded-md border border-zinc-700 bg-transparent px-3 py-1.5 text-sm text-zinc-100 outline-none transition-all duration-150",
          "hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
          isOpen && "border-indigo-500 ring-1 ring-indigo-500/50 bg-zinc-900/50",
          disabled && "opacity-50 cursor-not-allowed bg-zinc-900"
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-zinc-600">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5 overflow-hidden text-left">
            {visibleTags.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-200 border border-zinc-700"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => removeTag(e, opt.value)}
                  className="rounded-full p-0.5 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                >
                  <MdClose className="h-3 w-3" />
                </button>
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="text-xs text-zinc-500 self-center font-medium">+{hiddenCount} more</span>
            )}
          </div>
        )}
        <MdKeyboardArrowDown
          className={cn(
            "h-4 w-4 ml-2 text-zinc-500 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-700 bg-zinc-900 p-1 text-zinc-100 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors",
                  "hover:bg-zinc-800 focus:bg-zinc-800",
                  isSelected && "bg-indigo-500/10 text-indigo-400"
                )}
              >
                <div
                  className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded border border-zinc-600 transition-colors",
                    isSelected && "bg-indigo-600 border-indigo-600 text-white"
                  )}
                >
                  {isSelected && <MdCheck className="h-3 w-3" />}
                </div>
                <span className="font-medium text-left">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
