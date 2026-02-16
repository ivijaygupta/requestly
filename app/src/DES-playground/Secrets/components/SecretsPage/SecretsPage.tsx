import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Alert, ConfirmModal, Loading } from "../../../ui";
import { Provider, ProviderFormData } from "../../types";
import { useSecretsStore } from "../../hooks/useSecretsStore";
import { EmptyState } from "../EmptyState";
import { ProviderCard } from "../ProviderCard";
import { AddProviderModal } from "../AddProviderModal";
import { MdAdd } from "@react-icons/all-files/md/MdAdd";
import { MdOutlineVpnKey } from "@react-icons/all-files/md/MdOutlineVpnKey";
import PATHS from "config/constants/sub/paths";

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

  if (isLoading) {
    return (
      <div className="flex flex-col w-full max-w-[1200px] mx-auto p-8 animate-in fade-in duration-500">
        <Loading loading message="Loading secrets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full max-w-[1200px] mx-auto p-8 gap-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Secrets</h1>
        </div>
        <Alert
          type="error"
          message="Error loading providers"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex flex-col w-full max-w-[1200px] mx-auto p-8 gap-12 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Secrets</h1>
          <p className="text-zinc-500 text-sm">Manage your API keys and credentials through auth providers.</p>
        </div>
        <EmptyState
          title="No secrets yet"
          description="Add an auth provider to start managing API keys and secrets. Providers help organize and secure your credentials for different environments."
          actionLabel="Add provider"
          onAction={handleOpenAddModal}
          icon={<MdOutlineVpnKey className="w-8 h-8" />}
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

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-8 gap-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Secrets</h1>
          <p className="text-zinc-500 text-sm">Manage your API keys and credentials through auth providers.</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<MdAdd />}
          onClick={handleOpenAddModal}
          className="shadow-lg shadow-indigo-500/20"
        >
          Add provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider, index) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onClick={handleProviderClick}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleAddProvider}
        testConnection={testConnection}
      />

      {providerToDelete && (
        <ConfirmModal
          open={!!providerToDelete}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete provider"
          variant="destructive"
          confirmText="Delete provider"
          message={
            <div className="space-y-4 py-2">
              <p className="text-zinc-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">"{providerToDelete.name}"</span>?
              </p>
              {providerToDelete.secrets.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400 font-medium leading-relaxed">
                    This will also permanently delete {providerToDelete.secrets.length} secret
                    {providerToDelete.secrets.length !== 1 ? "s" : ""} associated with this provider.
                  </p>
                </div>
              )}
              <p className="text-xs text-zinc-500 italic">
                This action is irreversible and will break any requests dependent on these secrets.
              </p>
            </div>
          }
        />
      )}
    </div>
  );
};
