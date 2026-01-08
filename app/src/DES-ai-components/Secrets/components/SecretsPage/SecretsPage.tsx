import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert, Modal } from "antd";
import { RQButton } from "lib/design-system-v2/components";
import { Provider, ProviderFormData } from "../../types";
import { useSecretsStore } from "../../hooks/useSecretsStore";
import { EmptyState } from "../EmptyState";
import { ProviderCard } from "../ProviderCard";
import { AddProviderModal } from "../AddProviderModal";
import { MdAdd } from "@react-icons/all-files/md/MdAdd";
import { MdOutlineVpnKey } from "@react-icons/all-files/md/MdOutlineVpnKey";
import PATHS from "config/constants/sub/paths";
import "./SecretsPage.scss";

export const SecretsPage: React.FC = () => {
  const navigate = useNavigate();
  const { providers, isLoading, error, createProvider, deleteProvider, testConnection } = useSecretsStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleAddProvider = useCallback(
    (data: ProviderFormData) => {
      const newProvider = createProvider(data.name, data.type, data.config);

      // Navigate to the new provider's details page
      navigate(`${PATHS.SETTINGS.SECRETS.RELATIVE}/${newProvider.id}`);
      setIsAddModalOpen(false);
    },
    [createProvider, navigate]
  );

  const handleProviderClick = useCallback(
    (provider: Provider) => {
      navigate(`${PATHS.SETTINGS.SECRETS.RELATIVE}/${provider.id}`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback((provider: Provider) => {
    setProviderToDelete(provider);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (providerToDelete) {
      deleteProvider(providerToDelete.id);
      setProviderToDelete(null);
    }
  }, [providerToDelete, deleteProvider]);

  const handleCancelDelete = useCallback(() => {
    setProviderToDelete(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="secrets-page secrets-page--loading">
        <Spin size="large" />
        <p>Loading secrets...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="secrets-page">
        <div className="secrets-page__header">
          <h1 className="secrets-page__title">Secrets</h1>
        </div>
        <Alert
          type="error"
          message="Error loading providers"
          description={error}
          showIcon
          className="secrets-page__error"
          action={
            <RQButton type="secondary" size="small" onClick={() => window.location.reload()}>
              Retry
            </RQButton>
          }
        />
      </div>
    );
  }

  // Empty state
  if (providers.length === 0) {
    return (
      <div className="secrets-page">
        <div className="secrets-page__header">
          <h1 className="secrets-page__title">Secrets</h1>
        </div>
        <EmptyState
          title="No secrets yet"
          description="Add an auth provider to start managing API keys and secrets. Providers help organize and secure your credentials for different environments."
          actionLabel="Add provider"
          onAction={handleOpenAddModal}
          icon={<MdOutlineVpnKey />}
        />
        <AddProviderModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onSubmit={handleAddProvider}
          testConnection={testConnection}
        />
      </div>
    );
  }

  // Providers list
  return (
    <div className="secrets-page">
      <div className="secrets-page__header">
        <div className="secrets-page__header-content">
          <h1 className="secrets-page__title">Secrets</h1>
          <p className="secrets-page__description">Manage your API keys and credentials through auth providers.</p>
        </div>
        <RQButton type="primary" icon={<MdAdd />} onClick={handleOpenAddModal}>
          Add provider
        </RQButton>
      </div>

      <div className="secrets-page__providers-grid">
        {providers.map((provider, index) => (
          <div key={provider.id} className="secrets-page__provider-item" style={{ animationDelay: `${index * 50}ms` }}>
            <ProviderCard provider={provider} onClick={handleProviderClick} onDelete={handleDeleteClick} />
          </div>
        ))}
      </div>

      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleAddProvider}
        testConnection={testConnection}
      />

      <Modal
        title="Delete provider"
        open={!!providerToDelete}
        onCancel={handleCancelDelete}
        footer={
          <>
            <RQButton onClick={handleCancelDelete}>Cancel</RQButton>
            <RQButton type="danger" onClick={handleConfirmDelete}>
              Delete provider
            </RQButton>
          </>
        }
        className="custom-rq-modal"
      >
        {providerToDelete && (
          <>
            <p>
              Are you sure you want to delete <strong>{providerToDelete.name}</strong>?
            </p>
            {providerToDelete.secrets.length > 0 && (
              <p style={{ color: "var(--requestly-color-warning)" }}>
                This will also delete {providerToDelete.secrets.length} secret
                {providerToDelete.secrets.length !== 1 ? "s" : ""} stored in this provider.
              </p>
            )}
            <p style={{ color: "var(--requestly-color-text-subtle)", marginBottom: 0 }}>
              This action cannot be undone.
            </p>
          </>
        )}
      </Modal>
    </div>
  );
};
