import React from "react";
import { MdCheck } from "@react-icons/all-files/md/MdCheck";
import { cn } from "../lib/utils";

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  disabled = false,
  className = "",
  label,
}) => {
  return (
    <label
      className={cn(
        "flex items-center gap-2 cursor-pointer group select-none",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border border-zinc-700 bg-transparent transition-all duration-150 outline-none",
          checked
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "group-hover:border-zinc-500 focus-visible:ring-1 focus-visible:ring-indigo-500/50",
          disabled && "bg-zinc-900 border-zinc-800"
        )}
      >
        {checked && <MdCheck className="h-3 w-3" />}
      </button>
      {label && (
        <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{label}</span>
      )}
    </label>
  );
};
