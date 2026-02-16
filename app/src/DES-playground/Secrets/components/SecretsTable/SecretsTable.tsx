import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button, Input, Checkbox, Tooltip, MultiSelect, Spinner } from "../../../ui";
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
      const validatedRows = newRows.map((row) => {
        const rowName = row.name || "";
        const isDuplicate = !!(rowName.trim() && duplicateNames.has(rowName.toLowerCase()));

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

  // Render cell based on column type
  const renderCell = useCallback(
    (colDef: SecretColumnDefinition, record: SecretRow) => {
      const value = (record as any)[colDef.dataIndex];
      const recordName = record.name || "";
      const isDuplicate =
        colDef.dataIndex === "name" && !!(recordName.trim() && duplicateNames.has(recordName.toLowerCase()));

      switch (colDef.type) {
        case "checkbox":
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={value}
                onChange={(checked) => handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, checked)}
                disabled={isReadOnly}
              />
            </div>
          );

        case "password": {
          const isVisible = visibleSecrets.has(record.id);
          return (
            <Input
              value={value || ""}
              onChange={(e) => handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, e.target.value)}
              placeholder={colDef.placeholder}
              disabled={isReadOnly}
              type={isVisible ? "text" : "password"}
              suffixIcon={
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility(record.id)}
                  className="p-1 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  {isVisible ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                </button>
              }
            />
          );
        }

        case "readonly": {
          const isVisible = visibleSecrets.has(record.id);
          const hasValue = value && value.trim();

          if (record.isFetching) {
            return (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Spinner size="sm" />
                <span>Fetching...</span>
              </div>
            );
          }

          if (!hasValue) {
            return <span className="text-zinc-600 text-xs italic">Not fetched</span>;
          }

          return (
            <Input
              value={isVisible ? value : "••••••••"}
              disabled
              className="bg-zinc-900/30 border-dashed border-zinc-800"
              suffixIcon={
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility(record.id)}
                  className="p-1 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  {isVisible ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                </button>
              }
            />
          );
        }

        case "select":
          return (
            <MultiSelect
              value={value || []}
              onChange={(selectedValues) =>
                handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, selectedValues)
              }
              placeholder={colDef.placeholder || "Select environments"}
              disabled={isReadOnly}
              options={
                colDef.options?.map((opt) => ({ value: opt.value, label: opt.label })) ||
                ENVIRONMENT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))
              }
              maxTagCount={1}
            />
          );

        case "text":
        default:
          return (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={value || ""}
                onChange={(e) => handleCellChange(record.id, colDef.dataIndex as keyof SecretRow, e.target.value)}
                placeholder={colDef.placeholder}
                disabled={isReadOnly}
                error={isDuplicate}
                className="flex-1"
              />
              {isDuplicate && (
                <Tooltip content="Duplicate name will cause conflicts">
                  <MdWarning className="text-yellow-500 w-4 h-4 flex-shrink-0" />
                </Tooltip>
              )}
            </div>
          );
      }
    },
    [handleCellChange, toggleSecretVisibility, visibleSecrets, duplicateNames, isReadOnly]
  );

  const showFetchButton = providerType !== ProviderType.GENERIC && onFetchSecrets;
  const usageText = getSecretsUsageText(providerName);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
            <tr>
              {columnDefs.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider"
                  style={{ width: col.width || undefined }}
                >
                  <div className="flex items-center gap-1.5">
                    {col.title}
                    {col.helpText && (
                      <Tooltip content={col.helpText}>
                        <MdHelpOutline className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-help" />
                      </Tooltip>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 w-[50px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnDefs.length + 1} className="px-4 py-12 text-center text-sm text-zinc-500 italic">
                  No secrets configured. Add secrets to fetch from your provider.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="group hover:bg-zinc-800/20 transition-colors">
                  {columnDefs.map((col) => (
                    <td key={col.key} className="px-4 py-2 align-middle" style={{ width: col.width || undefined }}>
                      {renderCell(col, row)}
                    </td>
                  ))}
                  <td className="px-4 py-2 align-middle text-right">
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              icon={<MdAdd />}
              onClick={handleAddRow}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Add Secret
            </Button>
          )}
          {showFetchButton && (
            <Button
              variant="secondary"
              size="sm"
              loading={isFetching}
              icon={!isFetching && <MdRefresh />}
              onClick={onFetchSecrets}
              disabled={isFetching}
            >
              {isFetching ? "Fetching..." : "Fetch Secrets"}
            </Button>
          )}
        </div>
        <div className="text-[11px] font-mono text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">{usageText}</div>
      </div>
    </div>
  );
};
