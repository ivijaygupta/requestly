import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSecretsStore } from "../../hooks/useSecretsStore";
import { ProviderDetailsPage } from "../ProviderDetailsPage";
import { SecretRow, Secret, ProviderType } from "../../types";

/**
 * Wrapper component that connects ProviderDetailsPage to the secrets store
 * and provides the provider data based on URL params
 */
export const ProviderDetailsWrapper: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { providers, isLoading, error, saveSecrets, deleteProvider } = useSecretsStore();

  // Find the current provider
  const provider = useMemo(() => {
    if (!providerId) return undefined;
    return providers.find((p) => p.id === providerId);
  }, [providers, providerId]);

  // Handle saving secrets
  const handleSaveSecrets = (id: string, secrets: SecretRow[]): boolean => {
    if (!provider) return false;

    // Filter out rows that are completely empty
    const validSecrets = secrets.filter((s) => {
      const name = s.name || "";
      // For generic provider, check name and value
      if (provider.type === ProviderType.GENERIC) {
        return name.trim() || (s.value || "").trim();
      }
      // For cloud providers, check name and provider-specific identifier
      return name.trim() || (s.secretNameOrArn || "").trim() || (s.secretName || "").trim() || (s.path || "").trim();
    });

    // Convert SecretRow to Secret format for storage based on provider type
    const now = Date.now();
    const secretsToSave: Secret[] = validSecrets.map((s) => {
      const baseSecret = {
        id: s.id || `${now}-${Math.random().toString(36).substr(2, 9)}`,
        enabled: s.enabled ?? true,
        name: (s.name || "").trim(),
        value: (s.value || "").trim(),
        environments: s.environments || [],
        createdAt: s.createdAt || now,
        updatedAt: now,
      };

      // Convert to provider-specific secret type
      switch (provider.type) {
        case ProviderType.AWS_SECRETS_MANAGER:
          return {
            ...baseSecret,
            secretNameOrArn: (s.secretNameOrArn || "").trim(),
          } as Secret;

        case ProviderType.AZURE_KEY_VAULT:
          return {
            ...baseSecret,
            secretName: (s.secretName || "").trim(),
          } as Secret;

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

    return saveSecrets(id, secretsToSave);
  };

  return (
    <ProviderDetailsPage
      provider={provider}
      isLoading={isLoading}
      error={error}
      onSaveSecrets={handleSaveSecrets}
      onDeleteProvider={deleteProvider}
    />
  );
};
