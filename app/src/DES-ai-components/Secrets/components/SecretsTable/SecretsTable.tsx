import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Input, Tooltip, Checkbox, Spin, Select } from "antd";
import { RQButton } from "lib/design-system-v2/components";
import { ContentListTable } from "componentsV2/ContentList";
import {
  Secret,
  SecretRow,
  ProviderType,
  PROVIDER_SECRET_COLUMNS,
  SecretColumnDefinition,
  createDefaultSecret,
  getSecretsUsageText,
  ENVIRONMENT_OPTIONS,
} from "../../types";
import { MdAdd } from "@react-icons/all-files/md/MdAdd";
import { MdDelete } from "@react-icons/all-files/md/MdDelete";
import { MdVisibility } from "@react-icons/all-files/md/MdVisibility";
import { MdVisibilityOff } from "@react-icons/all-files/md/MdVisibilityOff";
import { MdWarning } from "@react-icons/all-files/md/MdWarning";
import { MdRefresh } from "@react-icons/all-files/md/MdRefresh";
import { MdHelpOutline } from "@react-icons/all-files/md/MdHelpOutline";
import { LoadingOutlined } from "@ant-design/icons";
import "./SecretsTable.scss";

interface SecretsTableProps {
  secrets: Secret[];
  providerType: ProviderType;
  providerName: string;
  onChange: (secrets: SecretRow[]) => void;
  onFetchSecrets?: () => Promise<void>;
  isReadOnly?: boolean;
  isFetching?: boolean;
}

export const SecretsTable: React.FC<SecretsTableProps> = ({
  secrets,
  providerType,
  providerName,
  onChange,
  onFetchSecrets,
  isReadOnly = false,
  isFetching = false,
}) => {
  const [rows, setRows] = useState<SecretRow[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  // Get column definitions for this provider type
  const columnDefs = PROVIDER_SECRET_COLUMNS[providerType];

  // Initialize rows from secrets
  useEffect(() => {
    if (secrets.length === 0 && !isReadOnly) {
      setRows([createDefaultSecret(providerType)]);
    } else {
      setRows(
        secrets.map((s) => ({
          ...s,
          enabled: (s as SecretRow).enabled ?? true,
          name: (s as SecretRow).name || (s as any).key || "",
          isNew: false,
        }))
      );
    }
  }, [secrets, isReadOnly, providerType]);

  // Find duplicate names
  const duplicateNames = useMemo(() => {
    const nameCounts = new Map<string, number>();
    rows.forEach((row) => {
      const rowName = row.name || "";
      if (rowName.trim()) {
        const name = rowName.toLowerCase();
        nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      }
    });

    const duplicates = new Set<string>();
    nameCounts.forEach((count, name) => {
      if (count > 1) duplicates.add(name);
    });
    return duplicates;
  }, [rows]);

  // Update rows and notify parent
  const updateRows = useCallback(
    (newRows: SecretRow[]) => {
      // Mark rows with validation errors
      const validatedRows = newRows.map((row) => {
        const rowName = row.name || "";
        const isDuplicate = rowName.trim() && duplicateNames.has(rowName.toLowerCase());

        return {
          ...row,
          hasError: isDuplicate,
          errorMessage: isDuplicate ? "Duplicate name" : undefined,
        };
      });

      setRows(validatedRows);
      onChange(validatedRows);
    },
    [onChange, duplicateNames]
  );

  const handleCellChange = useCallback(
    (rowId: string, field: keyof SecretRow, value: string | boolean | string[]) => {
      const newRows = rows.map((row) => (row.id === rowId ? { ...row, [field]: value, updatedAt: Date.now() } : row));
      updateRows(newRows);
    },
    [rows, updateRows]
  );

  const handleAddRow = useCallback(() => {
    const newRows = [...rows, createDefaultSecret(providerType)];
    updateRows(newRows);
  }, [rows, updateRows, providerType]);

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      const newRows = rows.filter((row) => row.id !== rowId);

      // Always keep at least one empty row
      if (newRows.length === 0 && !isReadOnly) {
        updateRows([createDefaultSecret(providerType)]);
      } else {
        updateRows(newRows);
      }
    },
    [rows, updateRows, isReadOnly, providerType]
  );

  const toggleSecretVisibility = useCallback((rowId: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  // Generate table columns from column definitions
  const columns = useMemo(() => {
    const tableColumns = columnDefs.map((colDef: SecretColumnDefinition) => {
      const column: any = {
        title: (
          <div className="secrets-table__column-title">
            {colDef.title}
            {colDef.helpText && (
              <Tooltip title={colDef.helpText}>
                <MdHelpOutline className="secrets-table__help-icon" />
              </Tooltip>
            )}
          </div>
        ),
        dataIndex: colDef.dataIndex,
        key: colDef.key,
        width: colDef.width,
      };

      // Render based on column type
      switch (colDef.type) {
        case "checkbox":
          column.render = (value: boolean, record: SecretRow) => (
            <Checkbox
              checked={value}
              onChange={(e) => handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, e.target.checked)}
              disabled={isReadOnly}
            />
          );
          break;

        case "password":
          column.render = (value: string, record: SecretRow) => {
            const isVisible = visibleSecrets.has(record.id);
            return (
              <div className="secrets-table__cell secrets-table__value-cell">
                <Input
                  value={value || ""}
                  onChange={(e) => handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, e.target.value)}
                  placeholder={colDef.placeholder}
                  disabled={isReadOnly}
                  type={isVisible ? "text" : "password"}
                  className="secrets-table__input secrets-table__value-input"
                />
                <RQButton
                  type="transparent"
                  icon={isVisible ? <MdVisibilityOff /> : <MdVisibility />}
                  onClick={() => toggleSecretVisibility(record.id)}
                  className="secrets-table__visibility-btn"
                />
              </div>
            );
          };
          break;

        case "readonly":
          column.render = (value: string, record: SecretRow) => {
            const isVisible = visibleSecrets.has(record.id);
            const hasValue = value && value.trim();

            return (
              <div className="secrets-table__cell secrets-table__readonly-cell">
                {record.isFetching ? (
                  <span className="secrets-table__fetching">
                    <LoadingOutlined spin />
                  </span>
                ) : hasValue ? (
                  <>
                    <Input
                      value={isVisible ? value : "••••••••"}
                      disabled
                      className="secrets-table__input secrets-table__readonly-input"
                    />
                    <RQButton
                      type="transparent"
                      icon={isVisible ? <MdVisibilityOff /> : <MdVisibility />}
                      onClick={() => toggleSecretVisibility(record.id)}
                      className="secrets-table__visibility-btn"
                    />
                  </>
                ) : (
                  <span className="secrets-table__empty-value">Not fetched</span>
                )}
              </div>
            );
          };
          break;

        case "select":
          column.render = (value: string[], record: SecretRow) => {
            return (
              <div className="secrets-table__cell">
                <Select
                  mode="multiple"
                  value={value || []}
                  onChange={(selectedValues) =>
                    handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, selectedValues)
                  }
                  placeholder={colDef.placeholder || "Select environments"}
                  disabled={isReadOnly}
                  className="secrets-table__select"
                  options={colDef.options || ENVIRONMENT_OPTIONS}
                  maxTagCount="responsive"
                  style={{ width: "100%" }}
                />
              </div>
            );
          };
          break;

        case "text":
        default:
          column.render = (value: string, record: SecretRow) => {
            const recordName = record.name || "";
            const isDuplicate =
              colDef.dataIndex === "name" && recordName.trim() && duplicateNames.has(recordName.toLowerCase());

            return (
              <div className="secrets-table__cell">
                <Input
                  value={value || ""}
                  onChange={(e) => handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, e.target.value)}
                  placeholder={colDef.placeholder}
                  disabled={isReadOnly}
                  status={isDuplicate ? "error" : undefined}
                  className="secrets-table__input"
                />
                {isDuplicate && (
                  <Tooltip title="Duplicate name will cause conflicts">
                    <MdWarning className="secrets-table__warning-icon" />
                  </Tooltip>
                )}
              </div>
            );
          };
      }

      return column;
    });

    // Add actions column
    tableColumns.push({
      title: "",
      key: "actions",
      width: 50,
      render: (_: unknown, record: SecretRow) => (
        <div className="secrets-table__actions">
          {!isReadOnly && (
            <RQButton
              type="transparent"
              icon={<MdDelete />}
              onClick={() => handleDeleteRow(record.id)}
              className="secrets-table__delete-btn"
            />
          )}
        </div>
      ),
    });

    return tableColumns;
  }, [
    columnDefs,
    handleCellChange,
    handleDeleteRow,
    toggleSecretVisibility,
    visibleSecrets,
    duplicateNames,
    isReadOnly,
  ]);

  // Determine if we should show the Fetch Secrets button
  const showFetchButton = providerType !== ProviderType.GENERIC && onFetchSecrets;
  const usageText = getSecretsUsageText(providerName);

  return (
    <div className="secrets-table">
      <ContentListTable
        id="secrets-list"
        className="secrets-table__table"
        columns={columns}
        data={rows}
        rowKey="id"
        locale={{
          emptyText: (
            <div className="secrets-table__empty">
              <p>No secrets configured. Add secrets to fetch from your provider.</p>
            </div>
          ),
        }}
        bordered
        scroll={{ y: "calc(100vh - 380px)" }}
        footer={
          isReadOnly
            ? undefined
            : () => (
                <div className="secrets-table__footer">
                  <div className="secrets-table__footer-left">
                    <RQButton icon={<MdAdd />} size="small" onClick={handleAddRow}>
                      Add Secret
                    </RQButton>
                  </div>
                  {showFetchButton && (
                    <div className="secrets-table__footer-right">
                      <RQButton
                        type="primary"
                        icon={isFetching ? <LoadingOutlined spin /> : <MdRefresh />}
                        size="small"
                        onClick={onFetchSecrets}
                        disabled={isFetching}
                      >
                        {isFetching ? "Fetching..." : "Fetch Secrets"}
                      </RQButton>
                    </div>
                  )}
                </div>
              )
        }
      />
      <div className="secrets-table__usage-hint">{usageText}</div>
    </div>
  );
};
