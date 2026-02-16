import React, { useState } from "react";
import { MdVisibility } from "@react-icons/all-files/md/MdVisibility";
import { MdVisibilityOff } from "@react-icons/all-files/md/MdVisibilityOff";
import { MdClose } from "@react-icons/all-files/md/MdClose";
import { cn } from "../lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  error?: boolean;
  inputSize?: "sm" | "md" | "lg";
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      inputSize = "md",
      prefixIcon,
      suffixIcon,
      type,
      allowClear,
      onClear,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const hasValue = value !== undefined && value !== "";
    const hasRightContent = suffixIcon || isPassword || (allowClear && hasValue);

    const sizes = {
      sm: "h-7 px-2 text-xs",
      md: "h-8 px-3 text-sm",
      lg: "h-10 px-4 text-base",
    };

    return (
      <div className="relative flex items-center w-full">
        {prefixIcon && (
          <span className="absolute left-3 text-zinc-500 flex items-center pointer-events-none">{prefixIcon}</span>
        )}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full bg-transparent border rounded-md font-mono text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-150",
            "hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:bg-zinc-900/50",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "border-zinc-700",
            sizes[inputSize],
            prefixIcon && "pl-10",
            hasRightContent && "pr-10",
            props.disabled && "opacity-50 cursor-not-allowed bg-zinc-900 text-zinc-500",
            className
          )}
          {...props}
        />
        {hasRightContent && (
          <span className="absolute right-2 flex items-center gap-1">
            {allowClear && hasValue && !props.disabled && (
              <button
                type="button"
                onClick={() => onClear?.()}
                className="p-1 text-zinc-500 hover:text-zinc-100 transition-colors rounded hover:bg-zinc-800"
              >
                <MdClose className="w-4 h-4" />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-zinc-500 hover:text-zinc-100 transition-colors rounded hover:bg-zinc-800"
              >
                {showPassword ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
              </button>
            )}
            {suffixIcon && !isPassword && <span className="p-1 text-zinc-500">{suffixIcon}</span>}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
