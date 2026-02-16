/**
 * React hook for managing secrets state
 * Provides a clean interface for components to interact with secrets storage
 */

import { useState, useCallback, useEffect } from "react";
import { Provider, Secret, ProviderType, ProviderConfig } from "../types";
import * as storage from "../services/secretsStorage";

interface UseSecretsStoreReturn {
  // State
  providers: Provider[];
  isLoading: boolean;
  error: string | null;

  // Provider operations
  refreshProviders: () => void;
  createProvider: (name: string, type: ProviderType, config: ProviderConfig) => Provider;
  updateProvider: (providerId: string, updates: Partial<Pick<Provider, "name" | "config">>) => Provider | undefined;
  deleteProvider: (providerId: string) => boolean;
  getProvider: (providerId: string) => Provider | undefined;

  // Secret operations
  saveSecrets: (providerId: string, secrets: Secret[]) => boolean;
  addSecret: (providerId: string, key: string, value: string, description?: string) => Secret | undefined;
  updateSecret: (
    providerId: string,
    secretId: string,
    updates: Partial<Pick<Secret, "key" | "value" | "description">>
  ) => Secret | undefined;
  deleteSecret: (providerId: string, secretId: string) => boolean;

  // Connection testing
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

export const useSecretsStore = (): UseSecretsStoreReturn => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProviders = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate small delay for loading state visibility
      setTimeout(() => {
        const data = storage.getProviders();
        setProviders(data);
        setIsLoading(false);
      }, 100);
    } catch (err) {
      setError("Failed to load providers");
      setIsLoading(false);
    }
  }, []);

  // Load providers on mount
  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const createProvider = useCallback((name: string, type: ProviderType, config: ProviderConfig): Provider => {
    const newProvider = storage.createProvider(name, type, config);
    setProviders((prev) => [...prev, newProvider]);
    return newProvider;
  }, []);

  const updateProvider = useCallback((providerId: string, updates: Partial<Pick<Provider, "name" | "config">>):
    | Provider
    | undefined => {
    const updated = storage.updateProvider(providerId, updates);
    if (updated) {
      setProviders((prev) => prev.map((p) => (p.id === providerId ? updated : p)));
    }
    return updated;
  }, []);

  const deleteProvider = useCallback((providerId: string): boolean => {
    const success = storage.deleteProvider(providerId);
    if (success) {
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
    }
    return success;
  }, []);

  const getProvider = useCallback(
    (providerId: string): Provider | undefined => {
      return providers.find((p) => p.id === providerId);
    },
    [providers]
  );

  const saveSecrets = useCallback((providerId: string, secrets: Secret[]): boolean => {
    const success = storage.saveSecrets(providerId, secrets);
    if (success) {
      setProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, secrets, updatedAt: Date.now() } : p)));
    }
    return success;
  }, []);

  const addSecret = useCallback((providerId: string, key: string, value: string, description?: string):
    | Secret
    | undefined => {
    const newSecret = storage.addSecret(providerId, key, value, description);
    if (newSecret) {
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, secrets: [...p.secrets, newSecret], updatedAt: Date.now() } : p))
      );
    }
    return newSecret;
  }, []);

  const updateSecret = useCallback(
    (
      providerId: string,
      secretId: string,
      updates: Partial<Pick<Secret, "key" | "value" | "description">>
    ): Secret | undefined => {
      const updated = storage.updateSecret(providerId, secretId, updates);
      if (updated) {
        setProviders((prev) =>
          prev.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  secrets: p.secrets.map((s) => (s.id === secretId ? updated : s)),
                  updatedAt: Date.now(),
                }
              : p
          )
        );
      }
      return updated;
    },
    []
  );

  const deleteSecret = useCallback((providerId: string, secretId: string): boolean => {
    const success = storage.deleteSecret(providerId, secretId);
    if (success) {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? {
                ...p,
                secrets: p.secrets.filter((s) => s.id !== secretId),
                updatedAt: Date.now(),
              }
            : p
        )
      );
    }
    return success;
  }, []);

  const testConnection = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    return storage.testProviderConnection();
  }, []);

  return {
    providers,
    isLoading,
    error,
    refreshProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    getProvider,
    saveSecrets,
    addSecret,
    updateSecret,
    deleteSecret,
    testConnection,
  };
};
