import React, { useState, useMemo, useEffect } from "react";
import { ImportItem, ImportModalProps } from "./types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { cn } from "../lib/utils";

// Mock Data
const MOCK_DATA: ImportItem[] = [
  {
    id: "collections",
    label: "Collections",
    type: "collection",
    count: 4,
    children: [
      { id: "c1", label: "ChatGPT API", type: "folder", count: 0 },
      { id: "c2", label: "RESTful API basics: CRUD, test & variable", type: "folder", count: 0 },
      { id: "c3", label: "Contract testing", type: "folder", count: 0 },
      { id: "c4", label: "Intro to writing tests", type: "folder", count: 0 },
    ],
  },
  {
    id: "requests",
    label: "Requests",
    type: "request",
    count: 325,
    children: [{ id: "r1", label: "Check for Valid API Params", type: "request", count: 0 }],
  },
  {
    id: "environment",
    label: "Environment",
    type: "environment",
    count: 2,
    children: [],
  },
];

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(["collections", "requests", "environment"]));

  // Simple highlighting helper
  const renderLabel = (label: string) => {
    if (!searchTerm) return label;
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = label.split(new RegExp(`(${escapedSearchTerm})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getIcon = (type: ImportItem["type"]) => {
    switch (type) {
      case "collection":
        return <CollectionIcon className="w-4 h-4 text-violet-400" />;
      case "request":
        return <RequestIcon className="w-4 h-4 text-emerald-400" />;
      case "environment":
        return <EnvironmentIcon className="w-4 h-4 text-blue-400" />;
      case "folder":
        return <FolderIcon className="w-4 h-4 text-amber-400" />;
      case "test":
        return <FileIcon className="w-4 h-4 text-[#666]" />;
      default:
        return <FolderIcon className="w-4 h-4 text-[#666]" />;
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const toggleSelect = (id: string, children: ImportItem[] = []) => {
    const newSelected = new Set(selectedItems);
    const isSelected = newSelected.has(id);

    if (isSelected) {
      newSelected.delete(id);
      children.forEach((child) => newSelected.delete(child.id));
    } else {
      newSelected.add(id);
      children.forEach((child) => newSelected.add(child.id));
    }
    setSelectedItems(newSelected);
  };

  // Filter logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return MOCK_DATA;

    const filterItem = (item: ImportItem): ImportItem | null => {
      const matches = item.label.toLowerCase().includes(searchTerm.toLowerCase());
      let filteredChildren: ImportItem[] = [];
      if (item.children) {
        filteredChildren = item.children.map(filterItem).filter((child): child is ImportItem => child !== null);
      }

      if (matches || filteredChildren.length > 0) {
        return { ...item, children: filteredChildren };
      }
      return null;
    };

    return MOCK_DATA.map(filterItem).filter((item): item is ImportItem => item !== null);
  }, [searchTerm]);

  // Auto-expand on search
  useEffect(() => {
    if (searchTerm) {
      const allIds = new Set<string>();
      const traverse = (items: ImportItem[]) => {
        items.forEach((item) => {
          allIds.add(item.id);
          if (item.children) traverse(item.children);
        });
      };
      traverse(filteredData);
      setExpandedItems(allIds);
    } else {
      setExpandedItems(new Set());
    }
  }, [searchTerm, filteredData]);

  const selectedCount = selectedItems.size;

  return (
    <Modal open={isOpen} onClose={onClose} hideCloseButton width="520px" className="bg-[#161616] border-[#252525]">
      {/* Custom Header */}
      <div className="flex items-center justify-between -mx-6 -mt-6 px-5 py-3 border-b border-[#252525]">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-md",
              "text-[#555] hover:text-[#999] hover:bg-[#252525]",
              "transition-colors duration-150"
            )}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <h2 className="text-[14px] font-medium text-[#e0e0e0]">Select items to import</h2>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md",
            "text-[#555] hover:text-[#999] hover:bg-[#252525]",
            "transition-colors duration-150"
          )}
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 -mx-6 px-5 py-4">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className={cn(
              "w-full h-9 pl-10 pr-3 rounded-md",
              "bg-[#1a1a1a] border border-[#2a2a2a]",
              "text-[13px] text-[#e0e0e0] placeholder:text-[#555]",
              "focus:outline-none focus:border-[#404040] focus:bg-[#1c1c1c]",
              "transition-colors duration-150"
            )}
          />
        </div>

        {/* Tree List */}
        <div className="max-h-[280px] overflow-y-auto rounded-md border border-[#252525] bg-[#141414]">
          {filteredData.map((item) => (
            <div key={item.id}>
              {/* Parent Item */}
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 cursor-pointer",
                  "hover:bg-[#1e1e1e]",
                  "transition-colors duration-100",
                  expandedItems.has(item.id) && "bg-[#1a1a1a]"
                )}
                onClick={(e) => {
                  if (item.children && item.children.length > 0) {
                    toggleExpand(item.id, e);
                  } else {
                    toggleSelect(item.id);
                  }
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id, item.children)}
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIcon(item.type)}
                  <span className="text-[13px] text-[#ccc] truncate">{renderLabel(item.label)}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#252525] text-[#888]">
                    {item.count}
                  </span>
                )}
                {item.children && item.children.length > 0 && (
                  <button
                    onClick={(e) => toggleExpand(item.id, e)}
                    className="p-0.5 text-[#555] hover:text-[#999] transition-colors"
                  >
                    <ChevronDownIcon
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-150",
                        expandedItems.has(item.id) && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Children */}
              {expandedItems.has(item.id) && item.children && item.children.length > 0 && (
                <div className="border-t border-[#252525]">
                  {item.children.map((child) => (
                    <div
                      key={child.id}
                      className={cn(
                        "flex items-center gap-2.5 pl-10 pr-3 py-2 cursor-pointer",
                        "hover:bg-[#1e1e1e]",
                        "transition-colors duration-100"
                      )}
                      onClick={() => toggleSelect(child.id)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedItems.has(child.id)} onChange={() => toggleSelect(child.id)} />
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getIcon(child.type)}
                        <span className="text-[13px] text-[#999] truncate">{renderLabel(child.label)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-900/10 border border-amber-700/20">
          <WarningIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-amber-300">Unsupported post request scripts</p>
            <p className="text-[11px] text-amber-200/60 mt-0.5 leading-relaxed">
              Post-response scripts are not supported yet. You can import other elements normally. For manual script
              import, please refer to this{" "}
              <a href="#" className="text-amber-400 hover:underline">
                guide
              </a>
              .
            </p>
          </div>
          <button className="p-1 text-amber-500/50 hover:text-amber-400 transition-colors">
            <ChevronDownIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between -mx-6 -mb-6 px-5 py-3 border-t border-[#252525] bg-[#141414]">
        <button className="flex items-center gap-1.5 text-[12px] text-[#666] hover:text-[#999] transition-colors">
          <HelpIcon className="w-3.5 h-3.5" />
          Need help
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#888] hover:text-[#ccc] hover:bg-[#252525]"
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Import {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </div>
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

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="4" />
    <path d="M13 13l-3-3" strokeLinecap="round" />
  </svg>
);

const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 5h6M5 8h6M5 11h3" strokeLinecap="round" />
  </svg>
);

const RequestIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 8h8M11 5l3 3-3 3M12 8H4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EnvironmentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v12M2 8h12" strokeLinecap="round" />
    <circle cx="8" cy="8" r="3" />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 13H2a1 1 0 01-1-1V4a1 1 0 011-1h4l2 2h6a1 1 0 011 1v6a1 1 0 01-1 1z" />
  </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" />
    <path d="M9 1v4h4" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
    <path d="M7.13 2.5l-5.5 10A1 1 0 002.5 14h11a1 1 0 00.87-1.5l-5.5-10a1 1 0 00-1.74 0z" />
  </svg>
);

const HelpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <path d="M6 6a2 2 0 114 0c0 1-1.5 1.5-1.5 2.5M8 11.5v.5" strokeLinecap="round" />
  </svg>
);

export default ImportModal;
