import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button, Input, Select, Modal, Alert, Tooltip, Spinner } from "../../../ui";
import {
  ProviderType,
  PROVIDER_TYPE_INFO,
  ProviderFormData,
  ProviderConfig,
  PROVIDER_FIELDS,
  FieldDefinition,
  getDefaultConfig,
} from "../../types";
import { MdRefresh } from "@react-icons/all-files/md/MdRefresh";
import { MdHelpOutline } from "@react-icons/all-files/md/MdHelpOutline";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProviderFormData) => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose, onSubmit, testConnection }) => {
  const [providerName, setProviderName] = useState("");
  const [providerType, setProviderType] = useState<ProviderType>(ProviderType.AWS_SECRETS_MANAGER);
  const [config, setConfig] = useState<ProviderConfig>(getDefaultConfig(ProviderType.AWS_SECRETS_MANAGER));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get fields for current provider type
  const fields = useMemo(() => PROVIDER_FIELDS[providerType] || [], [providerType]);

  // Reset form when provider type changes
  useEffect(() => {
    const newConfig = getDefaultConfig(providerType);
    setConfig(newConfig);
    setConnectionStatus("idle");
    setConnectionMessage("");
  }, [providerType]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProviderName("");
      setProviderType(ProviderType.AWS_SECRETS_MANAGER);
      setConfig(getDefaultConfig(ProviderType.AWS_SECRETS_MANAGER));
      setConnectionStatus("idle");
      setConnectionMessage("");
    }
  }, [isOpen]);

  // Check if a field should be visible based on showWhen condition
  const isFieldVisible = useCallback(
    (field: FieldDefinition): boolean => {
      if (!field.showWhen) return true;

      const { field: conditionField, value: conditionValue } = field.showWhen;
      const currentValue = (config as Record<string, unknown>)[conditionField];

      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(currentValue as string);
      }
      return currentValue === conditionValue;
    },
    [config]
  );

  // Handle config field change
  const handleConfigChange = useCallback((fieldName: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setConnectionStatus("idle");
    setConnectionMessage("");
  }, []);

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus("testing");
    setConnectionMessage("");

    try {
      const result = await testConnection();
      setConnectionStatus(result.success ? "success" : "error");
      setConnectionMessage(result.message);
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage("An unexpected error occurred while testing the connection.");
    }
  }, [testConnection]);

  const handleSubmit = useCallback(async () => {
    if (!providerName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      onSubmit({
        name: providerName.trim(),
        type: providerType,
        config,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [providerName, providerType, config, onSubmit]);

  const handleCancel = useCallback(() => {
    setProviderName("");
    setProviderType(ProviderType.AWS_SECRETS_MANAGER);
    setConfig(getDefaultConfig(ProviderType.AWS_SECRETS_MANAGER));
    setConnectionStatus("idle");
    setConnectionMessage("");
    onClose();
  }, [onClose]);

  // Render a single field based on its definition
  const renderField = useCallback(
    (field: FieldDefinition) => {
      if (!isFieldVisible(field)) return null;

      const value = ((config as Record<string, unknown>)[field.name] as string) || "";

      return (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 px-0.5">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
            {field.helpText && (
              <Tooltip content={field.helpText}>
                <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-help">
                  <MdHelpOutline className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            )}
          </label>
          {field.type === "select" ? (
            <Select
              value={value}
              onChange={(val) => handleConfigChange(field.name, val)}
              placeholder={field.placeholder}
              options={
                field.options?.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })) || []
              }
            />
          ) : (
            <Input
              type={field.type === "password" ? "password" : "text"}
              value={value}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </div>
      );
    },
    [config, handleConfigChange, isFieldVisible]
  );

  // Check if required fields are filled
  const isFormValid = useMemo(() => {
    if (!providerName.trim()) return false;

    for (const field of fields) {
      if (!isFieldVisible(field)) continue;
      if (!field.required) continue;

      const value = (config as Record<string, unknown>)[field.name];
      if (!value || (typeof value === "string" && !value.trim())) {
        return false;
      }
    }
    return true;
  }, [providerName, fields, config, isFieldVisible]);

  const providerTypeOptions = Object.entries(PROVIDER_TYPE_INFO).map(([type, info]) => ({
    value: type,
    label: info.label,
    description: info.description,
  }));

  return (
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title="Add Auth Provider"
      description="Configure a new provider to manage your API secrets and credentials."
      width="520px"
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={!isFormValid || connectionStatus === "testing"}
            loading={connectionStatus === "testing"}
          >
            Test Connection
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isFormValid}>
            Add Provider
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Provider Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 px-0.5">
            Provider Name<span className="text-red-500 ml-0.5">*</span>
          </label>
          <Input
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="e.g., Production AWS, Dev Environment"
            autoFocus
          />
        </div>

        {/* Provider Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 px-0.5">
            Provider Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <Select
            value={providerType}
            onChange={(value) => setProviderType(value as ProviderType)}
            options={providerTypeOptions}
          />
        </div>

        {/* Configuration Section */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-4 px-0.5 border-b border-zinc-800 pb-2">
            {PROVIDER_TYPE_INFO[providerType].label} Configuration
          </div>
          <div className="space-y-4">{fields.map(renderField)}</div>
        </div>

        {/* Connection Status */}
        {connectionStatus !== "idle" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <Alert
              type={connectionStatus === "success" ? "success" : connectionStatus === "error" ? "error" : "info"}
              message={
                connectionStatus === "testing" ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-current" />
                    Testing connection...
                  </span>
                ) : (
                  connectionMessage
                )
              }
              action={
                connectionStatus === "error" ? (
                  <Button variant="ghost" size="sm" icon={<MdRefresh />} onClick={handleTestConnection}>
                    Retry
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
