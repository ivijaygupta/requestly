import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Alert, ConfirmModal, Loading } from "../../../ui";
import { SecretRow, Secret, ProviderType, PROVIDER_TYPE_INFO } from "../../types";
import { useSecretsStore } from "../../hooks/useSecretsStore";
import { SecretsTable } from "../../components/SecretsTable";
import { EmptyState } from "../../components/EmptyState";
import { MdArrowBack } from "@react-icons/all-files/md/MdArrowBack";
import { MdOutlineSearch } from "@react-icons/all-files/md/MdOutlineSearch";
import { MdDelete } from "@react-icons/all-files/md/MdDelete";
import PATHS from "config/constants/sub/paths";

export const ProviderDetailsPageView: React.FC = () => {
  const navigate = useNavigate();
  const { providerId } = useParams<{ providerId: string }>();
  const { providers, isLoading, error, saveSecrets, deleteProvider } = useSecretsStore();

  const [pendingSecrets, setPendingSecrets] = useState<SecretRow[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [unsavedChangesModal, setUnsavedChangesModal] = useState(false);

  // Find the current provider
  const provider = useMemo(() => {
    if (!providerId) return undefined;
    return providers.find((p) => p.id === providerId);
  }, [providers, providerId]);

  // Initialize pending secrets from provider
  useEffect(() => {
    if (provider) {
      setPendingSecrets(provider.secrets.map((s) => ({ ...s, isNew: false } as SecretRow)));
      setHasUnsavedChanges(false);
    }
  }, [provider]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setUnsavedChangesModal(true);
    } else {
      navigate(PATHS.DESIGN.SECRETS.ABSOLUTE);
    }
  }, [navigate, hasUnsavedChanges]);

  const handleSecretsChange = useCallback((secrets: SecretRow[]) => {
    setPendingSecrets(secrets);
    setHasUnsavedChanges(true);
    setSaveError(null);
  }, []);

  const handleFetchSecrets = useCallback(async () => {
    if (!provider) return;

    setIsFetching(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

      const updatedSecrets = pendingSecrets.map((secret) => {
        const hasReference = secret.secretNameOrArn?.trim() || secret.secretName?.trim() || secret.path?.trim();

        if (!secret.enabled || !hasReference) {
          return secret;
        }

        const success = Math.random() > 0.2;

        if (success) {
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
    if (!providerId || !provider) return;

    const invalidSecrets = pendingSecrets.filter((s) => {
      const secretName = s.name || "";
      const hasData = s.value?.trim() || s.secretNameOrArn?.trim() || s.secretName?.trim() || s.path?.trim();
      return !secretName.trim() && hasData;
    });

    if (invalidSecrets.length > 0) {
      setSaveError("Some secrets have data but no name. Please add names or remove empty rows.");
      return;
    }

    const secretsToSave = pendingSecrets.filter((s) => {
      const secretName = s.name || "";
      const hasAnyData =
        secretName.trim() || s.value?.trim() || s.secretNameOrArn?.trim() || s.secretName?.trim() || s.path?.trim();
      return hasAnyData;
    });

    setIsSaving(true);
    setSaveError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const now = Date.now();
      const convertedSecrets: Secret[] = secretsToSave.map((s) => {
        const baseSecret = {
          id: s.id || `${now}-${Math.random().toString(36).substr(2, 9)}`,
          enabled: s.enabled ?? true,
          name: (s.name || "").trim(),
          value: (s.value || "").trim(),
          environments: s.environments || [],
          createdAt: s.createdAt || now,
          updatedAt: now,
        };

        switch (provider.type) {
          case ProviderType.AWS_SECRETS_MANAGER:
            return { ...baseSecret, secretNameOrArn: (s.secretNameOrArn || "").trim() } as Secret;
          case ProviderType.AZURE_KEY_VAULT:
            return { ...baseSecret, secretName: (s.secretName || "").trim() } as Secret;
          case ProviderType.HASHICORP_VAULT:
            return {
              ...baseSecret,
              path: (s.path || "").trim(),
              key: s.key ? (s.key || "").trim() : undefined,
            } as Secret;
          case ProviderType.GENERIC:
          default:
            return baseSecret as Secret;
        }
      });

      const success = saveSecrets(providerId, convertedSecrets);
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
  }, [providerId, provider, pendingSecrets, saveSecrets]);

  const handleDeleteProvider = useCallback(() => {
    if (!providerId) return;

    const success = deleteProvider(providerId);
    if (success) {
      navigate(PATHS.DESIGN.SECRETS.ABSOLUTE);
    }
  }, [providerId, deleteProvider, navigate]);

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
      <div className="flex flex-col w-full h-full max-w-[1200px] mx-auto p-8 gap-8 animate-in fade-in duration-500">
        <Loading loading message="Loading provider..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-full max-w-[1200px] mx-auto p-8 gap-8 animate-in fade-in duration-500">
        <EmptyState
          title="Error loading provider"
          description={error}
          actionLabel="Go back"
          onAction={() => navigate(PATHS.DESIGN.SECRETS.ABSOLUTE)}
        />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col w-full h-full max-w-[1200px] mx-auto p-8 gap-8 animate-in fade-in duration-500">
        <EmptyState
          title="Provider not found"
          description="The provider you're looking for doesn't exist or has been deleted."
          actionLabel="Go back"
          onAction={() => navigate(PATHS.DESIGN.SECRETS.ABSOLUTE)}
        />
      </div>
    );
  }

  const typeInfo = PROVIDER_TYPE_INFO[provider.type];

  return (
    <div className="flex flex-col w-full h-full max-w-[1200px] mx-auto p-8 gap-8 animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="flex items-center gap-5 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
          >
            <MdArrowBack className="w-5 h-5" />
          </button>

          <div
            className="flex items-center justify-center w-12 h-12 rounded-lg border-2 font-bold text-xs shrink-0"
            style={{
              backgroundColor: typeInfo.bgColor,
              borderColor: typeInfo.color,
              color: typeInfo.color,
            }}
          >
            {typeInfo.shortLabel}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight truncate">{provider.name}</h2>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-bold"
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
                  <span className="text-zinc-700 select-none">•</span>
                  <span className="text-zinc-500 text-xs font-mono">{provider.region}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          icon={<MdDelete />}
          onClick={() => setDeleteModalVisible(true)}
          className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
        >
          Delete provider
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search secrets..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-500 text-xs font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Unsaved changes
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasUnsavedChanges || isFetching}
            className="shadow-lg shadow-indigo-500/20"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {saveError && (
        <Alert
          type="error"
          message={saveError}
          closable
          onClose={() => setSaveError(null)}
          className="animate-in slide-in-from-top-2"
        />
      )}

      {/* Secrets Table */}
      <div className="flex-1 min-h-0 min-w-0">
        <SecretsTable
          secrets={searchValue ? filteredSecrets : pendingSecrets}
          providerType={provider.type}
          providerName={provider.name}
          onChange={handleSecretsChange}
          onFetchSecrets={handleFetchSecrets}
          isFetching={isFetching}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteProvider}
        title="Delete provider"
        variant="destructive"
        confirmText="Delete provider"
        message={
          <div className="space-y-4 py-2">
            <p className="text-zinc-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{provider.name}"</span>?
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 font-medium leading-relaxed">
                This will permanently delete {provider.secrets.length} secret{provider.secrets.length !== 1 ? "s" : ""}{" "}
                stored in this provider.
              </p>
            </div>
            <p className="text-xs text-zinc-500 italic">This action cannot be undone.</p>
          </div>
        }
      />

      {/* Unsaved Changes Modal */}
      <ConfirmModal
        open={unsavedChangesModal}
        onClose={() => setUnsavedChangesModal(false)}
        onConfirm={() => navigate(PATHS.DESIGN.SECRETS.ABSOLUTE)}
        title="Unsaved changes"
        confirmText="Leave without saving"
        cancelText="Stay and save"
        message="You have unsaved changes that will be lost if you leave. Are you sure you want to proceed?"
      />
    </div>
  );
};
