import React from "react";
import { MdClose } from "@react-icons/all-files/md/MdClose";
import { MdError } from "@react-icons/all-files/md/MdError";
import { MdCheckCircle } from "@react-icons/all-files/md/MdCheckCircle";
import { MdWarning } from "@react-icons/all-files/md/MdWarning";
import { MdInfo } from "@react-icons/all-files/md/MdInfo";
import { cn } from "../lib/utils";

export interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: React.ReactNode;
  description?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const icons = {
  success: MdCheckCircle,
  error: MdError,
  warning: MdWarning,
  info: MdInfo,
};

const styles = {
  success: "bg-green-500/10 border-green-500/20 text-green-400",
  error: "bg-red-500/10 border-red-500/20 text-red-400",
  warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  info: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
};

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  description,
  closable,
  onClose,
  action,
  className = "",
}) => {
  const Icon = icons[type];

  return (
    <div className={cn("flex w-full items-start gap-3 rounded-md border p-4", styles[type], className)}>
      <span className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-none mb-1">{message}</div>
        {description && <div className="text-xs opacity-80 leading-relaxed">{description}</div>}
      </div>
      {action && <div className="flex-shrink-0 mt-0.5">{action}</div>}
      {closable && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 mt-0.5 rounded-md p-1 opacity-50 hover:opacity-100 hover:bg-black/10 transition-all"
        >
          <MdClose className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
