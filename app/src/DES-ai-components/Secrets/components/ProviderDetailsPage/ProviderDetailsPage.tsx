import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Spin, Modal, Alert } from "antd";
import { RQButton } from "lib/design-system-v2/components";
import { Provider, SecretRow, PROVIDER_TYPE_INFO } from "../../types";
import { SecretsTable } from "../SecretsTable";
import { EmptyState } from "../EmptyState";
import { MdArrowBack } from "@react-icons/all-files/md/MdArrowBack";
import { MdOutlineSearch } from "@react-icons/all-files/md/MdOutlineSearch";
import { MdDelete } from "@react-icons/all-files/md/MdDelete";
import PATHS from "config/constants/sub/paths";
import "./ProviderDetailsPage.scss";

interface ProviderDetailsPageProps {
  provider: Provider | undefined;
  isLoading: boolean;
  onSaveSecrets: (providerId: string, secrets: SecretRow[]) => boolean;
  onDeleteProvider: (providerId: string) => boolean;
  error: string | null;
}

export const ProviderDetailsPage: React.FC<ProviderDetailsPageProps> = ({
  provider,
  isLoading,
  onSaveSecrets,
  onDeleteProvider,
  error,
}) => {
  const navigate = useNavigate();
  const { providerId } = useParams<{ providerId: string }>();

  const [pendingSecrets, setPendingSecrets] = useState<SecretRow[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Initialize pending secrets from provider
  useEffect(() => {
    if (provider) {
      setPendingSecrets(provider.secrets.map((s) => ({ ...s, isNew: false } as SecretRow)));
      setHasUnsavedChanges(false);
    }
  }, [provider]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: "Unsaved changes",
        content: "You have unsaved changes. Are you sure you want to leave?",
        okText: "Leave",
        cancelText: "Stay",
        onOk: () => navigate(PATHS.SETTINGS.SECRETS.RELATIVE),
      });
    } else {
      navigate(PATHS.SETTINGS.SECRETS.RELATIVE);
    }
  }, [navigate, hasUnsavedChanges]);

  const handleSecretsChange = useCallback((secrets: SecretRow[]) => {
    setPendingSecrets(secrets);
    setHasUnsavedChanges(true);
    setSaveError(null);
  }, []);

  // Simulated fetch secrets handler
  // In production, this would call the actual provider API
  const handleFetchSecrets = useCallback(async () => {
    if (!provider) return;

    setIsFetching(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

      // Simulate fetching secrets - in production this would call AWS/Azure/HashiCorp APIs
      const updatedSecrets = pendingSecrets.map((secret) => {
        // Only fetch for enabled secrets that have a reference (secretNameOrArn, secretName, path)
        const hasReference = secret.secretNameOrArn?.trim() || secret.secretName?.trim() || secret.path?.trim();

        if (!secret.enabled || !hasReference) {
          return secret;
        }

        // Simulate 80% success rate for fetching
        const success = Math.random() > 0.2;

        if (success) {
          // Generate a fake fetched value
          const fakeValue = `fetched_${secret.name || "secret"}_${Math.random().toString(36).substr(2, 8)}`;
          return {
            ...secret,
            value: fakeValue,
            updatedAt: Date.now(),
          };
        }

        return secret;
      });

      setPendingSecrets(updatedSecrets);
      setHasUnsavedChanges(true);
    } catch (err) {
      setSaveError("Failed to fetch secrets. Check your provider configuration.");
    } finally {
      setIsFetching(false);
    }
  }, [provider, pendingSecrets]);

  const handleSave = useCallback(async () => {
    if (!providerId) return;

    // Validate: check for empty names with other data
    const invalidSecrets = pendingSecrets.filter((s) => {
      const secretName = s.name || "";
      const hasData = s.value?.trim() || s.secretNameOrArn?.trim() || s.secretName?.trim() || s.path?.trim();
      return !secretName.trim() && hasData;
    });

    if (invalidSecrets.length > 0) {
      setSaveError("Some secrets have data but no name. Please add names or remove empty rows.");
      return;
    }

    // Filter out completely empty rows
    const secretsToSave = pendingSecrets.filter((s) => {
      const secretName = s.name || "";
      const hasAnyData =
        secretName.trim() || s.value?.trim() || s.secretNameOrArn?.trim() || s.secretName?.trim() || s.path?.trim();
      return hasAnyData;
    });

    setIsSaving(true);
    setSaveError(null);

    try {
      // Small delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 300));

      const success = onSaveSecrets(providerId, secretsToSave);
      if (success) {
        setHasUnsavedChanges(false);
      } else {
        setSaveError("Failed to save secrets. Please try again.");
      }
    } catch (err) {
      setSaveError("An error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [providerId, pendingSecrets, onSaveSecrets]);

  const handleDeleteProvider = useCallback(() => {
    if (!providerId) return;

    const success = onDeleteProvider(providerId);
    if (success) {
      navigate(PATHS.SETTINGS.SECRETS.RELATIVE);
    }
  }, [providerId, onDeleteProvider, navigate]);

  // Filter secrets by search
  const filteredSecrets = useMemo(() => {
    if (!searchValue.trim()) return pendingSecrets;

    const query = searchValue.toLowerCase();
    return pendingSecrets.filter((s) => {
      const searchableFields = [s.name, s.secretNameOrArn, s.secretName, s.path, s.key].filter(Boolean);

      return searchableFields.some((field) => field?.toLowerCase().includes(query));
    });
  }, [pendingSecrets, searchValue]);

  if (isLoading) {
    return (
      <div className="provider-details-page provider-details-page--loading">
        <Spin size="large" />
        <p>Loading provider...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-details-page">
        <EmptyState
          title="Error loading provider"
          description={error}
          actionLabel="Go back"
          onAction={() => navigate(PATHS.SETTINGS.SECRETS.RELATIVE)}
        />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="provider-details-page">
        <EmptyState
          title="Provider not found"
          description="The provider you're looking for doesn't exist or has been deleted."
          actionLabel="Go back"
          onAction={() => navigate(PATHS.SETTINGS.SECRETS.RELATIVE)}
        />
      </div>
    );
  }

  const typeInfo = PROVIDER_TYPE_INFO[provider.type];

  return (
    <div className="provider-details-page">
      <div className="provider-details-page__header">
        <div className="provider-details-page__header-left">
          <RQButton
            type="transparent"
            icon={<MdArrowBack />}
            onClick={handleBack}
            className="provider-details-page__back-btn"
          />
          <div
            className="provider-details-page__provider-icon"
            style={{
              backgroundColor: typeInfo.bgColor,
              borderColor: typeInfo.color,
            }}
          >
            <span style={{ color: typeInfo.color, fontWeight: 800 }}>{typeInfo.shortLabel}</span>
          </div>
          <div className="provider-details-page__header-info">
            <h2 className="provider-details-page__title">{provider.name}</h2>
            <div className="provider-details-page__meta">
              <span
                className="provider-details-page__type"
                style={{
                  color: typeInfo.color,
                  backgroundColor: typeInfo.bgColor,
                  borderColor: `${typeInfo.color}40`,
                }}
              >
                {typeInfo.label}
              </span>
              {provider.region && (
                <>
                  <span className="provider-details-page__separator">•</span>
                  <span className="provider-details-page__region">{provider.region}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="provider-details-page__header-actions">
          <RQButton
            type="transparent"
            icon={<MdDelete />}
            onClick={() => setDeleteModalVisible(true)}
            className="provider-details-page__delete-btn"
          >
            Delete
          </RQButton>
        </div>
      </div>

      <div className="provider-details-page__toolbar">
        <Input
          placeholder="Search secrets..."
          prefix={<MdOutlineSearch />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="provider-details-page__search"
          allowClear
        />

        <div className="provider-details-page__save-section">
          {hasUnsavedChanges && (
            <div className="provider-details-page__unsaved-indicator">
              <span className="provider-details-page__unsaved-dot" />
              Unsaved changes
            </div>
          )}
          <RQButton type="primary" onClick={handleSave} loading={isSaving} disabled={!hasUnsavedChanges || isFetching}>
            {isSaving ? "Saving..." : "Save secrets"}
          </RQButton>
        </div>
      </div>

      {saveError && (
        <Alert
          type="error"
          message={saveError}
          showIcon
          closable
          onClose={() => setSaveError(null)}
          className="provider-details-page__error"
        />
      )}

      <SecretsTable
        secrets={searchValue ? filteredSecrets : pendingSecrets}
        providerType={provider.type}
        providerName={provider.name}
        onChange={handleSecretsChange}
        onFetchSecrets={handleFetchSecrets}
        isFetching={isFetching}
      />

      <Modal
        title="Delete provider"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={
          <>
            <RQButton onClick={() => setDeleteModalVisible(false)}>Cancel</RQButton>
            <RQButton type="danger" onClick={handleDeleteProvider}>
              Delete provider
            </RQButton>
          </>
        }
        className="custom-rq-modal"
      >
        <p>
          Are you sure you want to delete <strong>{provider.name}</strong>? This will also delete all{" "}
          {provider.secrets.length} secret{provider.secrets.length !== 1 ? "s" : ""} stored in this provider.
        </p>
        <p style={{ color: "var(--requestly-color-text-subtle)", marginBottom: 0 }}>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};
