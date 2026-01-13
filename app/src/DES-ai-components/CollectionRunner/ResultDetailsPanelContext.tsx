import React, { createContext, useContext, useState, ReactNode } from "react";
import { RequestExecutionResult } from "features/apiClient/store/collectionRunResult/runResult.store";

interface ResultDetailsPanelContextType {
  selectedResult: RequestExecutionResult | null;
  isOpen: boolean;
  openPanel: (result: RequestExecutionResult) => void;
  closePanel: () => void;
}

const ResultDetailsPanelContext = createContext<ResultDetailsPanelContextType | undefined>(undefined);

export const ResultDetailsPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedResult, setSelectedResult] = useState<RequestExecutionResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = (result: RequestExecutionResult) => {
    setSelectedResult(result);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    // Delay clearing the result to allow animation to complete
    setTimeout(() => {
      setSelectedResult(null);
    }, 300);
  };

  return (
    <ResultDetailsPanelContext.Provider value={{ selectedResult, isOpen, openPanel, closePanel }}>
      {children}
    </ResultDetailsPanelContext.Provider>
  );
};

export const useResultDetailsPanel = () => {
  const context = useContext(ResultDetailsPanelContext);
  if (!context) {
    throw new Error("useResultDetailsPanel must be used within ResultDetailsPanelProvider");
  }
  return context;
};
