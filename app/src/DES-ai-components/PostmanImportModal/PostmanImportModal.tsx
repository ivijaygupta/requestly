import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../lib/utils";

interface PostmanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOADING_STEPS = [
  { step: 1, text: "Reading files…" },
  { step: 2, text: "Parsing collections" },
  { step: 3, text: "Validating requests" },
  { step: 3, text: "Preparing import" },
];

export const PostmanImportModal: React.FC<PostmanImportModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        if (prevIndex < LOADING_STEPS.length - 1) {
          return prevIndex + 1;
        }
        return 0;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  const handleImportAgain = () => {
    setCurrentStepIndex(0);
  };

  return (
    <Modal open={isOpen} onClose={onClose} hideCloseButton width="480px" className="bg-[#161616] border-[#252525]">
      {/* Custom Header */}
      <div className="flex items-center gap-2 -mx-6 -mt-6 px-5 py-4 border-b border-[#252525]">
        <button
          onClick={onClose}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "text-[#666] hover:text-[#ccc] hover:bg-[#252525]",
            "transition-colors duration-150"
          )}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <h2 className="text-[15px] font-medium text-[#e0e0e0]">Importing from Postman</h2>
      </div>

      {/* Loading Content */}
      <div className="flex flex-col items-center py-10 px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner and Step Info */}
          <div className="flex items-center gap-3">
            <Spinner size="md" className="text-violet-500" />
            <div className="flex items-center gap-1.5 min-h-[20px]">
              <span className="text-[13px] font-medium text-[#888]">
                Step {LOADING_STEPS[currentStepIndex].step} of 3 ·
              </span>
              <AnimatePresence mode="wait">
                <m.span
                  key={currentStepIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-[13px] font-medium text-[#e0e0e0]"
                >
                  {LOADING_STEPS[currentStepIndex].text}
                </m.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-center mt-2">
            <p className="text-[12px] text-[#666] leading-relaxed">
              This is taking longer than usual for large collections.
            </p>
            <p className="text-[12px] text-[#666] leading-relaxed">
              Please keep this window open until the import finishes.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 -mx-6 -mb-6 px-5 py-3 border-t border-[#252525] bg-[#141414]">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImportAgain}
          icon={<ChevronLeftIcon className="w-3.5 h-3.5" />}
          className="text-[#888] hover:text-[#ccc] hover:bg-[#252525]"
        >
          Import again
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          className="bg-[#252525] border-[#333] text-[#ccc] hover:bg-[#2a2a2a] hover:border-[#404040]"
        >
          Cancel import
        </Button>
      </div>
    </Modal>
  );
};

// Icons
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
