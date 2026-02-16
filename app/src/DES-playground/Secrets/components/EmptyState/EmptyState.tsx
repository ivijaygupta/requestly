import React from "react";
import { Button } from "../../../ui";
import { MdAdd } from "@react-icons/all-files/md/MdAdd";
import { cn } from "../../../lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30",
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 mb-6 animate-in zoom-in duration-300">
          {icon}
        </div>
      )}
      <div className="max-w-[420px] mb-8">
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="lg"
          icon={<MdAdd />}
          onClick={onAction}
          className="shadow-lg shadow-indigo-500/20"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
