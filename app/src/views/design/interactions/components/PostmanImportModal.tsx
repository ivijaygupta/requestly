import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import { m, AnimatePresence } from "framer-motion";
import "./PostmanImportModal.scss";

interface PostmanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOADING_STEPS = [
  "Step 1 of 3 · Reading files…",
  "Parsing collections",
  "Validating requests",
  "Preparing import",
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
        // Loop back to step 1 after completing all steps
        return 0;
      });
    }, 2000); // Change text every 2 seconds

    return () => clearInterval(intervalId);
  }, [isOpen]);

  const handleImportAgain = () => {
    setCurrentStepIndex(0);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={480}
      centered
      maskStyle={{ background: "rgba(0, 0, 0, 0.8)" }}
      className="postman-import-modal"
      wrapClassName="postman-import-modal-wrapper"
    >
      <div className="postman-import-modal-content">
        {/* Header */}
        <div className="postman-import-modal-header">
          <button className="postman-import-modal-back-button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="postman-import-modal-title">Importing from Postman</h2>
        </div>

        {/* Loading Content */}
        <div className="postman-import-modal-body">
          <div className="postman-import-loading-section">
            <div className="postman-import-spinner-container">
              <div className="postman-import-spinner"></div>
              <AnimatePresence mode="wait">
                <m.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="postman-import-loading-text"
                >
                  {LOADING_STEPS[currentStepIndex]}
                </m.div>
              </AnimatePresence>
            </div>
            <div className="postman-import-info-text">
              <p>This is taking longer than usual for large collections.</p>
              <p>Please keep this window open until the import finishes.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="postman-import-modal-footer">
          <button className="postman-import-button postman-import-button-secondary" onClick={handleImportAgain}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Import again
          </button>
          <button className="postman-import-button postman-import-button-primary" onClick={handleCancel}>
            Cancel import
          </button>
        </div>
      </div>
    </Modal>
  );
};
