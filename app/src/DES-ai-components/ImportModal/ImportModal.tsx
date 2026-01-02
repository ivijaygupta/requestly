import React, { useState, useMemo, useEffect } from "react";
import { ImportItem, ImportModalProps } from "./types";
import styles from "./styles.module.scss";
import {
    SearchOutlined,
    LeftOutlined,
    CloseOutlined,
    DownOutlined,
    CopyrightOutlined, // For Collections (closest match)
    SwapOutlined, // For Requests (closest match)
    CloudServerOutlined, // For Environment (closest match)
    FolderOutlined,
    FileTextOutlined,
    WarningOutlined,
    QuestionCircleOutlined
} from "@ant-design/icons";

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
        children: [
            { id: "r1", label: "Check for Valid API Params", type: "request", count: 0 },
            // ... more requests would go here
        ],
    },
    {
        id: "environment",
        label: "Environment",
        type: "environment",
        count: 2,
        children: [], // Add children if needed for demo
    },
];

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(["collections", "requests", "environment"])); // Default all selected

    // Simple highlighting helper
    const renderLabel = (label: string) => {
        if (!searchTerm) return label;
        // Escape special regex characters to prevent crashes
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = label.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === searchTerm.toLowerCase() ? (
                        <span key={i} className={styles.highlight}>{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const getIcon = (type: ImportItem['type']) => {
        switch (type) {
            case 'collection': return <CopyrightOutlined />; // Placeholder
            case 'request': return <SwapOutlined />;
            case 'environment': return <CloudServerOutlined />;
            case 'folder': return <FolderOutlined />;
            case 'test': return <FileTextOutlined />;
            default: return <FolderOutlined />;
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
            // Deselect children
            children.forEach(child => newSelected.delete(child.id));
        } else {
            newSelected.add(id);
            // Select children
            children.forEach(child => newSelected.add(child.id));
        }
        setSelectedItems(newSelected);
    };

    // Filter logic
    const filteredData = useMemo(() => {
        if (!searchTerm) return MOCK_DATA;

        const filterItem = (item: ImportItem): ImportItem | null => {
            // Check if item matches
            const matches = item.label.toLowerCase().includes(searchTerm.toLowerCase());

            // Check children
            let filteredChildren: ImportItem[] = [];
            if (item.children) {
                filteredChildren = item.children
                    .map(filterItem)
                    .filter((child): child is ImportItem => child !== null);
            }

            if (matches || filteredChildren.length > 0) {
                return {
                    ...item,
                    children: filteredChildren // Keep struct but with filtered kids
                };
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
                items.forEach(item => {
                    allIds.add(item.id);
                    if (item.children) traverse(item.children);
                });
            };
            traverse(filteredData);
            setExpandedItems(allIds);
        } else {
            setExpandedItems(new Set()); // Collapse all on clear
        }
    }, [searchTerm, filteredData]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>
                        <LeftOutlined className={styles.backIcon} />
                        Select items to import
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <CloseOutlined />
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.searchContainer}>
                        <SearchOutlined className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className={styles.listContainer}>
                        {filteredData.map(item => (
                            <div key={item.id} className={styles.treeItem}>
                                <div
                                    className={`${styles.itemRow} ${expandedItems.has(item.id) ? styles.expanded : ''}`}
                                    onClick={(e) => {
                                        // If clicking row, toggle expand if it has children, else toggle select
                                        if (item.children && item.children.length > 0) {
                                            toggleExpand(item.id, e);
                                        } else {
                                            toggleSelect(item.id);
                                        }
                                    }}
                                >
                                    <div className={styles.checkbox} onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelect(item.id, item.children)}
                                        />
                                    </div>
                                    <div className={styles.itemContent}>
                                        {getIcon(item.type)}
                                        <span className={styles.itemLabel}>{renderLabel(item.label)}</span>
                                    </div>
                                    {(item.count !== undefined && item.count > 0) && <span className={styles.badge}>{item.count}</span>}

                                    {(item.children && item.children.length > 0) && (
                                        <DownOutlined
                                            className={`${styles.expandIcon} ${expandedItems.has(item.id) ? styles.open : ''}`}
                                            onClick={(e) => toggleExpand(item.id, e)}
                                        />
                                    )}
                                </div>

                                {/* Children rendering */}
                                {expandedItems.has(item.id) && item.children && item.children.length > 0 && (
                                    <div className={styles.childrenContainer}>
                                        {item.children.map(child => (
                                            <div key={child.id} className={styles.itemRow} onClick={() => toggleSelect(child.id)}>
                                                <div className={styles.checkbox} onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(child.id)}
                                                        onChange={() => toggleSelect(child.id)}
                                                    />
                                                </div>
                                                <div className={styles.itemContent}>
                                                    {getIcon(child.type)}
                                                    <span className={styles.itemLabel}>{renderLabel(child.label)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={styles.warningScript}>
                        <WarningOutlined className={styles.warningIcon} />
                        <div>
                            <strong>Unsupported post request scripts</strong><br />
                            Post-response scripts are not supported yet. You can import other elements normally. For manual script import, please refer to this <a href="#">guide</a>.
                        </div>
                        <DownOutlined style={{ marginLeft: 'auto', fontSize: '10px' }} />
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.helpLink}>
                        <QuestionCircleOutlined />
                        Need help
                    </div>
                    <div className={styles.footerActions}>
                        <button className={`${styles.button} ${styles.secondary}`} onClick={onClose}>
                            Cancel
                        </button>
                        <button className={`${styles.button} ${styles.primary}`} onClick={onClose}>
                            Import selected items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
