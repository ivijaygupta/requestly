import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Modal, Input, Select, Form, Alert, Tooltip } from "antd";
import { RQButton } from "lib/design-system-v2/components";
import {
  ProviderType,
  PROVIDER_TYPE_INFO,
  ProviderFormData,
  ProviderConfig,
  PROVIDER_FIELDS,
  FieldDefinition,
  getDefaultConfig,
} from "../../types";
import { MdCheckCircle } from "@react-icons/all-files/md/MdCheckCircle";
import { MdError } from "@react-icons/all-files/md/MdError";
import { MdRefresh } from "@react-icons/all-files/md/MdRefresh";
import { MdHelpOutline } from "@react-icons/all-files/md/MdHelpOutline";
import "./AddProviderModal.scss";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProviderFormData) => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose, onSubmit, testConnection }) => {
  const [form] = Form.useForm();
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
    form.setFieldsValue(newConfig);
  }, [providerType, form]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProviderName("");
      setProviderType(ProviderType.AWS_SECRETS_MANAGER);
      setConfig(getDefaultConfig(ProviderType.AWS_SECRETS_MANAGER));
      setConnectionStatus("idle");
      setConnectionMessage("");
      form.resetFields();
    }
  }, [isOpen, form]);

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
      // Small delay for UX feedback
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
    form.resetFields();
    onClose();
  }, [onClose, form]);

  // Render a single field based on its definition
  const renderField = useCallback(
    (field: FieldDefinition) => {
      if (!isFieldVisible(field)) return null;

      const value = ((config as Record<string, unknown>)[field.name] as string) || "";

      const labelWithHelp = field.helpText ? (
        <span className="add-provider-modal__label-with-help">
          {field.label}
          <Tooltip title={field.helpText}>
            <MdHelpOutline className="add-provider-modal__help-icon" />
          </Tooltip>
        </span>
      ) : (
        field.label
      );

      switch (field.type) {
        case "select":
          return (
            <Form.Item key={field.name} label={labelWithHelp} required={field.required}>
              <Select
                value={value}
                onChange={(val) => handleConfigChange(field.name, val)}
                placeholder={field.placeholder}
                className="add-provider-modal__select"
              >
                {field.options?.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          );

        case "password":
          return (
            <Form.Item key={field.name} label={labelWithHelp} required={field.required}>
              <Input.Password
                value={value}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="add-provider-modal__input"
              />
            </Form.Item>
          );

        case "url":
        case "text":
        default:
          return (
            <Form.Item key={field.name} label={labelWithHelp} required={field.required}>
              <Input
                value={value}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                type={field.type === "url" ? "url" : "text"}
                className="add-provider-modal__input"
              />
            </Form.Item>
          );
      }
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
      title={null}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={520}
      className="add-provider-modal custom-rq-modal"
      destroyOnClose
    >
      <div className="add-provider-modal__header">
        <h3>Add Auth Provider</h3>
        <p>Configure a new provider to manage your API secrets and credentials.</p>
      </div>

      <Form form={form} layout="vertical" className="add-provider-modal__form">
        <Form.Item label="Provider Name" required>
          <Input
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="e.g., Production AWS, Dev Environment"
            className="add-provider-modal__input"
            autoFocus
          />
        </Form.Item>

        <Form.Item label="Provider Type" required>
          <Select
            value={providerType}
            onChange={(value) => setProviderType(value as ProviderType)}
            className="add-provider-modal__select"
            optionLabelProp="label"
          >
            {providerTypeOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                <div className="add-provider-modal__type-option">
                  <span className="add-provider-modal__type-label">{opt.label}</span>
                  <span className="add-provider-modal__type-desc">{opt.description}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="add-provider-modal__config-section">
          <div className="add-provider-modal__config-title">{PROVIDER_TYPE_INFO[providerType].label} Configuration</div>
          {fields.map(renderField)}
        </div>

        {connectionStatus !== "idle" && (
          <Alert
            type={connectionStatus === "success" ? "success" : connectionStatus === "error" ? "error" : "info"}
            showIcon
            icon={
              connectionStatus === "testing" ? null : connectionStatus === "success" ? <MdCheckCircle /> : <MdError />
            }
            message={
              connectionStatus === "testing" ? (
                <span className="add-provider-modal__testing">Testing connection...</span>
              ) : (
                connectionMessage
              )
            }
            action={
              connectionStatus === "error" && (
                <RQButton type="transparent" size="small" icon={<MdRefresh />} onClick={handleTestConnection}>
                  Retry
                </RQButton>
              )
            }
            className="add-provider-modal__status"
          />
        )}
      </Form>

      <div className="add-provider-modal__footer">
        <RQButton onClick={handleCancel}>Cancel</RQButton>
        <RQButton
          onClick={handleTestConnection}
          disabled={!isFormValid || connectionStatus === "testing"}
          loading={connectionStatus === "testing"}
        >
          Test Connection
        </RQButton>
        <RQButton type="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isFormValid}>
          Add Provider
        </RQButton>
      </div>
    </Modal>
  );
};
