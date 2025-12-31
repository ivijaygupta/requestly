import React, { useState } from "react";
import { PostmanImportModal } from "./components/PostmanImportModal";
import "./interactions.scss";

const InteractionsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="interactions-page">
      <div className="interactions-page-container">
        <h1 className="interactions-page-title">Design Interactions</h1>
        <p className="interactions-page-description">Showcase of interactive components and design patterns</p>

        <div className="interactions-grid">
          <div className="interaction-card" onClick={() => setIsModalOpen(true)}>
            <div className="interaction-card-header">
              <h3>Postman Import Modal</h3>
              <span className="interaction-card-badge">Loading Animation</span>
            </div>
            <p className="interaction-card-description">
              Modal with animated loading text that cycles through import steps
            </p>
            <div className="interaction-card-preview">
              <div className="preview-modal-mock">
                <div className="preview-modal-header">
                  <span className="preview-back-icon">←</span>
                  <span>Importing from Postman</span>
                </div>
                <div className="preview-loading-content">
                  <div className="preview-spinner"></div>
                  <span>Reading files…</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PostmanImportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
};

export default InteractionsPage;
