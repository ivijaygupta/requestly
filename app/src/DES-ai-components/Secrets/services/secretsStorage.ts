/**
 * Local JSON storage service for secrets and providers
 * Uses localStorage as a simple persistence layer for this prototype
 */

import { Provider, Secret, SecretsData, ProviderType, ProviderConfig, getDefaultConfig } from "../types";

const STORAGE_KEY = "requestly_secrets_data";
const CURRENT_VERSION = 2; // Bumped for config structure change

// Default empty state
const getDefaultData = (): SecretsData => ({
  providers: [],
  version: CURRENT_VERSION,
});

/**
 * Migrate old provider format to new config structure
 */
const migrateProvider = (provider: Provider): Provider => {
  // If provider already has config, no migration needed
  if (provider.config && Object.keys(provider.config).length > 0) {
    return provider;
  }

  // Migrate legacy fields to config
  const config: ProviderConfig = getDefaultConfig(provider.type);

  if (provider.type === ProviderType.AWS_SECRETS_MANAGER && provider.region) {
    (config as Record<string, string>).region = provider.region;
  }

  return {
    ...provider,
    config,
  };
};

/**
 * Read secrets data from localStorage
 */
export const readSecretsData = (): SecretsData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultData();
    }
    const data = JSON.parse(stored) as SecretsData;

    // Migrate providers if needed
    data.providers = data.providers.map(migrateProvider);

    return data;
  } catch (error) {
    console.error("Failed to read secrets data:", error);
    return getDefaultData();
  }
};

/**
 * Write secrets data to localStorage
 */
export const writeSecretsData = (data: SecretsData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to write secrets data:", error);
    throw new Error("Failed to save secrets data. Please try again.");
  }
};

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all providers
 */
export const getProviders = (): Provider[] => {
  return readSecretsData().providers;
};

/**
 * Get a single provider by ID
 */
export const getProvider = (providerId: string): Provider | undefined => {
  return readSecretsData().providers.find((p) => p.id === providerId);
};

/**
 * Create a new provider
 */
export const createProvider = (name: string, type: ProviderType, config: ProviderConfig): Provider => {
  const data = readSecretsData();
  const now = Date.now();

  const newProvider: Provider = {
    id: generateId(),
    name,
    type,
    config,
    secrets: [],
    createdAt: now,
    updatedAt: now,
  };

  data.providers.push(newProvider);
  writeSecretsData(data);

  return newProvider;
};

/**
 * Update a provider
 */
export const updateProvider = (
  providerId: string,
  updates: Partial<Pick<Provider, "name" | "config">>
): Provider | undefined => {
  const data = readSecretsData();
  const index = data.providers.findIndex((p) => p.id === providerId);

  if (index === -1) {
    return undefined;
  }

  data.providers[index] = {
    ...data.providers[index],
    ...updates,
    updatedAt: Date.now(),
  };

  writeSecretsData(data);
  return data.providers[index];
};

/**
 * Delete a provider
 */
export const deleteProvider = (providerId: string): boolean => {
  const data = readSecretsData();
  const initialLength = data.providers.length;
  data.providers = data.providers.filter((p) => p.id !== providerId);

  if (data.providers.length < initialLength) {
    writeSecretsData(data);
    return true;
  }
  return false;
};

/**
 * Get all secrets for a provider
 */
export const getSecrets = (providerId: string): Secret[] => {
  const provider = getProvider(providerId);
  return provider?.secrets ?? [];
};

/**
 * Save secrets for a provider (replaces all secrets)
 */
export const saveSecrets = (providerId: string, secrets: Secret[]): boolean => {
  const data = readSecretsData();
  const index = data.providers.findIndex((p) => p.id === providerId);

  if (index === -1) {
    return false;
  }

  // Assign IDs to new secrets and update timestamps
  const now = Date.now();
  const processedSecrets = secrets.map((secret) => ({
    ...secret,
    id: secret.id || generateId(),
    updatedAt: now,
    createdAt: secret.createdAt || now,
  }));

  data.providers[index].secrets = processedSecrets;
  data.providers[index].updatedAt = now;
  writeSecretsData(data);

  return true;
};

/**
 * Add a single secret to a provider
 */
export const addSecret = (providerId: string, key: string, value: string, description?: string): Secret | undefined => {
  const data = readSecretsData();
  const providerIndex = data.providers.findIndex((p) => p.id === providerId);

  if (providerIndex === -1) {
    return undefined;
  }

  const now = Date.now();
  const newSecret: Secret = {
    id: generateId(),
    key,
    value,
    description,
    createdAt: now,
    updatedAt: now,
  };

  data.providers[providerIndex].secrets.push(newSecret);
  data.providers[providerIndex].updatedAt = now;
  writeSecretsData(data);

  return newSecret;
};

/**
 * Update a secret
 */
export const updateSecret = (
  providerId: string,
  secretId: string,
  updates: Partial<Pick<Secret, "key" | "value" | "description">>
): Secret | undefined => {
  const data = readSecretsData();
  const providerIndex = data.providers.findIndex((p) => p.id === providerId);

  if (providerIndex === -1) {
    return undefined;
  }

  const secretIndex = data.providers[providerIndex].secrets.findIndex((s) => s.id === secretId);

  if (secretIndex === -1) {
    return undefined;
  }

  data.providers[providerIndex].secrets[secretIndex] = {
    ...data.providers[providerIndex].secrets[secretIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  data.providers[providerIndex].updatedAt = Date.now();
  writeSecretsData(data);

  return data.providers[providerIndex].secrets[secretIndex];
};

/**
 * Delete a secret
 */
export const deleteSecret = (providerId: string, secretId: string): boolean => {
  const data = readSecretsData();
  const providerIndex = data.providers.findIndex((p) => p.id === providerId);

  if (providerIndex === -1) {
    return false;
  }

  const initialLength = data.providers[providerIndex].secrets.length;
  data.providers[providerIndex].secrets = data.providers[providerIndex].secrets.filter((s) => s.id !== secretId);

  if (data.providers[providerIndex].secrets.length < initialLength) {
    data.providers[providerIndex].updatedAt = Date.now();
    writeSecretsData(data);
    return true;
  }
  return false;
};

/**
 * Simulate connection test (prototype only)
 * Returns success/failure randomly after a delay
 */
export const testProviderConnection = async (): Promise<{ success: boolean; message: string }> => {
  // Simulate network delay (500-800ms)
  const delay = 500 + Math.random() * 300;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Randomize success (80% success rate)
  const success = Math.random() > 0.2;

  return {
    success,
    message: success
      ? "Connection successful. Provider is ready to use."
      : "Connection failed. Please check your credentials and try again.",
  };
};
