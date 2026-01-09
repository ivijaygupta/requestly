import React, { useEffect, useCallback } from "react";
import { MdClose } from "@react-icons/all-files/md/MdClose";
import { Button } from "./Button";
import { cn } from "../lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  className?: string;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "520px",
  className = "",
  hideCloseButton = false,
}) => {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex flex-col w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in scale-in-95 duration-200",
          className
        )}
        style={{ width, maxWidth: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
            <div className="space-y-1">
              {title && <h3 className="text-lg font-semibold text-zinc-100 tracking-tight leading-none">{title}</h3>}
              {description && <p className="text-sm text-zinc-500">{description}</p>}
            </div>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
              >
                <MdClose className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-900/50 border-t border-zinc-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Confirm Modal helper
export interface ConfirmModalProps extends Omit<ModalProps, "children" | "footer"> {
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  variant = "default",
  ...props
}) => {
  return (
    <Modal
      {...props}
      onClose={onClose}
      width="400px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm text-zinc-400 font-normal leading-relaxed">{message}</div>
    </Modal>
  );
};
