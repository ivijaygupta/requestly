/**
 * Types for the Secrets & Auth Providers feature
 * This is a local-only prototype for managing API secrets
 *
 * Provider configurations based on:
 * - Postman Vault: https://learning.postman.com/docs/sending-requests/postman-vault/aws-secrets-manager/
 * - Bruno Secrets: https://docs.usebruno.com/secrets-management/
 */

// Available environment options for secrets
export const ENVIRONMENT_OPTIONS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "testing", label: "Testing" },
  { value: "local", label: "Local" },
] as const;

// Provider Types
export enum ProviderType {
  AWS_SECRETS_MANAGER = "aws",
  AZURE_KEY_VAULT = "azure",
  HASHICORP_VAULT = "hashicorp",
  GENERIC = "generic",
}

// AWS Authentication Types
export enum AWSAuthType {
  LONG_LIVED = "long_lived",
  TEMPORARY = "temporary",
}

// HashiCorp Vault Sub-Types
export enum HashiCorpVaultType {
  SERVER = "server",
  CLOUD = "cloud",
}

// HashiCorp Vault Server Auth Methods
export enum HashiCorpAuthMethod {
  TOKEN = "token",
  APP_ROLE = "app_role",
}

// Provider-specific configuration interfaces
export interface AWSConfig {
  authType: AWSAuthType;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string; // Required for temporary credentials
}

export interface AzureConfig {
  vaultName: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface HashiCorpConfig {
  vaultType: HashiCorpVaultType;
  // Server config
  serverUrl?: string;
  authMethod?: HashiCorpAuthMethod;
  token?: string; // For token auth
  roleId?: string; // For AppRole auth
  secretId?: string; // For AppRole auth
  // Cloud config
  clientId?: string;
  clientSecret?: string;
}

export interface GenericConfig {
  // Generic provider allows free-form config
  [key: string]: string;
}

// Union type for all provider configs
export type ProviderConfig = AWSConfig | AzureConfig | HashiCorpConfig | GenericConfig;

// Base secret interface - common fields across all provider types
export interface BaseSecret {
  id: string;
  enabled: boolean;
  name: string; // Variable name used in requests as $secrets.<provider>.<name>
  value: string; // Fetched or manually entered value
  environments?: string[]; // Environments where this secret is applicable
  createdAt: number;
  updatedAt: number;
}

// AWS Secret - references AWS Secrets Manager by Name/ARN
export interface AWSSecret extends BaseSecret {
  secretNameOrArn: string; // AWS Secret Name or ARN to fetch
}

// Azure Secret - references Azure Key Vault secret
export interface AzureSecret extends BaseSecret {
  secretName: string; // Azure Key Vault secret name
}

// HashiCorp Secret - references Vault path and key
export interface HashiCorpSecret extends BaseSecret {
  path: string; // Vault path (e.g., secret/data/myapp)
  key?: string; // Specific key within the secret (optional)
}

// Generic Secret - manually entered key-value pair
export interface GenericSecret extends BaseSecret {
  // No additional fields, value is manually entered
}

// Union type for all secret types
export type Secret = AWSSecret | AzureSecret | HashiCorpSecret | GenericSecret;

// Legacy interface for backward compatibility
export interface LegacySecret {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// Provider entity
export interface Provider {
  id: string;
  type: ProviderType;
  name: string;
  config: ProviderConfig;
  secrets: Secret[];
  createdAt: number;
  updatedAt: number;
  // Legacy fields for backward compatibility
  region?: string;
  endpoint?: string;
}

export interface SecretsData {
  providers: Provider[];
  version: number;
}

// Form types for adding/editing
export interface ProviderFormData {
  name: string;
  type: ProviderType;
  config: ProviderConfig;
  // Legacy fields
  region?: string;
  endpoint?: string;
}

export interface SecretFormData {
  name: string;
  value: string;
  // Provider-specific fields
  secretNameOrArn?: string; // AWS
  secretName?: string; // Azure
  path?: string; // HashiCorp
  key?: string; // HashiCorp
}

// Row type for table editing (includes temporary ID for new rows)
export interface SecretRow {
  id: string;
  enabled: boolean;
  name: string;
  value: string;
  environments?: string[]; // Environments where this secret is applicable
  createdAt: number;
  updatedAt: number;
  // Provider-specific fields (union of all)
  secretNameOrArn?: string; // AWS
  secretName?: string; // Azure
  path?: string; // HashiCorp
  key?: string; // HashiCorp (specific key)
  // UI state
  isNew?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  isFetching?: boolean;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

// Provider type display info
export interface ProviderTypeInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  shortLabel: string;
}

export const PROVIDER_TYPE_INFO: Record<ProviderType, ProviderTypeInfo> = {
  [ProviderType.AWS_SECRETS_MANAGER]: {
    label: "AWS Secrets Manager",
    shortLabel: "AWS",
    description: "Store and retrieve secrets from AWS Secrets Manager using access keys",
    color: "#FF9900",
    bgColor: "rgba(255, 153, 0, 0.15)",
  },
  [ProviderType.AZURE_KEY_VAULT]: {
    label: "Azure Key Vault",
    shortLabel: "Azure",
    description: "Connect to Azure Key Vault using service principal credentials",
    color: "#0078D4",
    bgColor: "rgba(0, 120, 212, 0.15)",
  },
  [ProviderType.HASHICORP_VAULT]: {
    label: "HashiCorp Vault",
    shortLabel: "Vault",
    description: "Integrate with HashiCorp Vault Server or HCP Vault Secrets",
    color: "#FFEC6E",
    bgColor: "rgba(255, 236, 110, 0.15)",
  },
  [ProviderType.GENERIC]: {
    label: "Local Secrets",
    shortLabel: "Local",
    description: "Store secrets locally for custom integrations",
    color: "#8B8B8B",
    bgColor: "rgba(139, 139, 139, 0.15)",
  },
};

// Field definitions for dynamic form rendering
export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "password" | "select" | "url";
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: { value: string; label: string }[];
  showWhen?: {
    field: string;
    value: string | string[];
  };
}

// AWS Fields
export const AWS_FIELDS: FieldDefinition[] = [
  {
    name: "authType",
    label: "Credentials Type",
    type: "select",
    required: true,
    options: [
      { value: AWSAuthType.LONG_LIVED, label: "Long-lived credentials" },
      { value: AWSAuthType.TEMPORARY, label: "Temporary credentials (STS)" },
    ],
    helpText: "Long-lived credentials are valid for 2 hours. Temporary credentials require a session token.",
  },
  {
    name: "accessKeyId",
    label: "Access Key ID",
    type: "text",
    placeholder: "AKIAIOSFODNN7EXAMPLE",
    required: true,
  },
  {
    name: "secretAccessKey",
    label: "Secret Access Key",
    type: "password",
    placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    required: true,
  },
  {
    name: "sessionToken",
    label: "Session Token",
    type: "password",
    placeholder: "FwoGZXIvYXdzEBY...",
    required: true,
    showWhen: { field: "authType", value: AWSAuthType.TEMPORARY },
    helpText: "Required for temporary credentials. Obtain from AWS STS.",
  },
  {
    name: "region",
    label: "Region",
    type: "text",
    placeholder: "us-east-1",
    required: true,
    helpText: "AWS region where your secrets are stored",
  },
];

// Azure Fields
export const AZURE_FIELDS: FieldDefinition[] = [
  {
    name: "vaultName",
    label: "Vault Name",
    type: "text",
    placeholder: "my-key-vault",
    required: true,
    helpText: "The name of your Azure Key Vault instance",
  },
  {
    name: "tenantId",
    label: "Tenant ID",
    type: "text",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    required: true,
    helpText: "Azure Active Directory tenant ID",
  },
  {
    name: "clientId",
    label: "Client ID",
    type: "text",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    required: true,
    helpText: "Application (client) ID from Azure AD",
  },
  {
    name: "clientSecret",
    label: "Client Secret",
    type: "password",
    placeholder: "Enter client secret",
    required: true,
    helpText: "Secret value from Azure AD app registration",
  },
];

// HashiCorp Fields
export const HASHICORP_FIELDS: FieldDefinition[] = [
  {
    name: "vaultType",
    label: "Vault Type",
    type: "select",
    required: true,
    options: [
      { value: HashiCorpVaultType.SERVER, label: "Vault Server (Self-hosted)" },
      { value: HashiCorpVaultType.CLOUD, label: "HCP Vault Secrets (Cloud)" },
    ],
  },
  // Server fields
  {
    name: "serverUrl",
    label: "Server URL",
    type: "url",
    placeholder: "https://vault.example.com:8200",
    required: true,
    showWhen: { field: "vaultType", value: HashiCorpVaultType.SERVER },
    helpText: "URL of your Vault server",
  },
  {
    name: "authMethod",
    label: "Authentication Method",
    type: "select",
    required: true,
    showWhen: { field: "vaultType", value: HashiCorpVaultType.SERVER },
    options: [
      { value: HashiCorpAuthMethod.TOKEN, label: "Token" },
      { value: HashiCorpAuthMethod.APP_ROLE, label: "AppRole" },
    ],
  },
  {
    name: "token",
    label: "Token",
    type: "password",
    placeholder: "hvs.CAESIJ...",
    required: true,
    showWhen: { field: "authMethod", value: HashiCorpAuthMethod.TOKEN },
    helpText: "Vault authentication token",
  },
  {
    name: "roleId",
    label: "Role ID",
    type: "text",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    required: true,
    showWhen: { field: "authMethod", value: HashiCorpAuthMethod.APP_ROLE },
    helpText: "AppRole Role ID",
  },
  {
    name: "secretId",
    label: "Secret ID",
    type: "password",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    required: true,
    showWhen: { field: "authMethod", value: HashiCorpAuthMethod.APP_ROLE },
    helpText: "AppRole Secret ID",
  },
  // Cloud fields
  {
    name: "clientId",
    label: "Client ID",
    type: "text",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    required: true,
    showWhen: { field: "vaultType", value: HashiCorpVaultType.CLOUD },
    helpText: "HCP service principal client ID",
  },
  {
    name: "clientSecret",
    label: "Client Secret",
    type: "password",
    placeholder: "Enter client secret",
    required: true,
    showWhen: { field: "vaultType", value: HashiCorpVaultType.CLOUD },
    helpText: "HCP service principal client secret",
  },
];

// Generic Fields - minimal, just for local storage
export const GENERIC_FIELDS: FieldDefinition[] = [
  {
    name: "description",
    label: "Description",
    type: "text",
    placeholder: "Optional description for this provider",
    required: false,
    helpText: "Describe what this provider is used for",
  },
];

// Map provider type to fields
export const PROVIDER_FIELDS: Record<ProviderType, FieldDefinition[]> = {
  [ProviderType.AWS_SECRETS_MANAGER]: AWS_FIELDS,
  [ProviderType.AZURE_KEY_VAULT]: AZURE_FIELDS,
  [ProviderType.HASHICORP_VAULT]: HASHICORP_FIELDS,
  [ProviderType.GENERIC]: GENERIC_FIELDS,
};

// Helper to get default config for a provider type
export const getDefaultConfig = (type: ProviderType): ProviderConfig => {
  switch (type) {
    case ProviderType.AWS_SECRETS_MANAGER:
      return {
        authType: AWSAuthType.LONG_LIVED,
        accessKeyId: "",
        secretAccessKey: "",
        region: "",
      } as AWSConfig;
    case ProviderType.AZURE_KEY_VAULT:
      return {
        vaultName: "",
        tenantId: "",
        clientId: "",
        clientSecret: "",
      } as AzureConfig;
    case ProviderType.HASHICORP_VAULT:
      return {
        vaultType: HashiCorpVaultType.SERVER,
        serverUrl: "",
        authMethod: HashiCorpAuthMethod.TOKEN,
        token: "",
      } as HashiCorpConfig;
    case ProviderType.GENERIC:
    default:
      return {} as GenericConfig;
  }
};

// Helper to get display summary for provider config
export const getConfigSummary = (type: ProviderType, config: ProviderConfig): string => {
  switch (type) {
    case ProviderType.AWS_SECRETS_MANAGER: {
      const awsConfig = config as AWSConfig;
      return awsConfig.region ? `Region: ${awsConfig.region}` : "AWS Secrets Manager";
    }
    case ProviderType.AZURE_KEY_VAULT: {
      const azureConfig = config as AzureConfig;
      return azureConfig.vaultName ? `Vault: ${azureConfig.vaultName}` : "Azure Key Vault";
    }
    case ProviderType.HASHICORP_VAULT: {
      const hcConfig = config as HashiCorpConfig;
      if (hcConfig.vaultType === HashiCorpVaultType.CLOUD) {
        return "HCP Vault Secrets";
      }
      return hcConfig.serverUrl ? `Server: ${new URL(hcConfig.serverUrl).hostname}` : "Vault Server";
    }
    case ProviderType.GENERIC:
    default:
      return "Local secrets";
  }
};

// Secret table column definitions per provider type
export interface SecretColumnDefinition {
  key: string;
  title: string;
  dataIndex: string;
  placeholder?: string;
  type: "checkbox" | "text" | "password" | "readonly" | "select";
  width?: number | string;
  required?: boolean;
  helpText?: string;
  options?: { value: string; label: string }[];
}

// AWS Secret columns - based on Bruno's AWS Secrets Manager UI
export const AWS_SECRET_COLUMNS: SecretColumnDefinition[] = [
  {
    key: "enabled",
    title: "Enabled",
    dataIndex: "enabled",
    type: "checkbox",
    width: 80,
  },
  {
    key: "name",
    title: "Name",
    dataIndex: "name",
    placeholder: "Variable name",
    type: "text",
    required: true,
    helpText: "Name used to reference this secret in requests",
  },
  {
    key: "secretNameOrArn",
    title: "Secret Name/ARN",
    dataIndex: "secretNameOrArn",
    placeholder: "my-secret or arn:aws:secretsmanager:...",
    type: "text",
    required: true,
    helpText: "AWS Secret Name or full ARN",
  },
  {
    key: "value",
    title: "Secrets",
    dataIndex: "value",
    type: "readonly",
    helpText: "Fetched from AWS Secrets Manager",
  },
  {
    key: "environments",
    title: "Environments",
    dataIndex: "environments",
    type: "select",
    width: 200,
    helpText: "Select environments where this secret is applicable",
    options: ENVIRONMENT_OPTIONS,
  },
];

// Azure Secret columns
export const AZURE_SECRET_COLUMNS: SecretColumnDefinition[] = [
  {
    key: "enabled",
    title: "Enabled",
    dataIndex: "enabled",
    type: "checkbox",
    width: 80,
  },
  {
    key: "name",
    title: "Name",
    dataIndex: "name",
    placeholder: "Variable name",
    type: "text",
    required: true,
    helpText: "Name used to reference this secret in requests",
  },
  {
    key: "secretName",
    title: "Secret Name",
    dataIndex: "secretName",
    placeholder: "my-secret",
    type: "text",
    required: true,
    helpText: "Name of the secret in Azure Key Vault",
  },
  {
    key: "value",
    title: "Secrets",
    dataIndex: "value",
    type: "readonly",
    helpText: "Fetched from Azure Key Vault",
  },
  {
    key: "environments",
    title: "Environments",
    dataIndex: "environments",
    type: "select",
    width: 200,
    helpText: "Select environments where this secret is applicable",
    options: ENVIRONMENT_OPTIONS,
  },
];

// HashiCorp Secret columns
export const HASHICORP_SECRET_COLUMNS: SecretColumnDefinition[] = [
  {
    key: "enabled",
    title: "Enabled",
    dataIndex: "enabled",
    type: "checkbox",
    width: 80,
  },
  {
    key: "name",
    title: "Name",
    dataIndex: "name",
    placeholder: "Variable name",
    type: "text",
    required: true,
    helpText: "Name used to reference this secret in requests",
  },
  {
    key: "path",
    title: "Path",
    dataIndex: "path",
    placeholder: "secret/data/myapp",
    type: "text",
    required: true,
    helpText: "Vault path to the secret",
  },
  {
    key: "key",
    title: "Key",
    dataIndex: "key",
    placeholder: "api_key (optional)",
    type: "text",
    required: false,
    helpText: "Specific key within the secret (leave empty for all keys)",
  },
  {
    key: "value",
    title: "Secrets",
    dataIndex: "value",
    type: "readonly",
    helpText: "Fetched from HashiCorp Vault",
  },
  {
    key: "environments",
    title: "Environments",
    dataIndex: "environments",
    type: "select",
    width: 200,
    helpText: "Select environments where this secret is applicable",
    options: ENVIRONMENT_OPTIONS,
  },
];

// Generic Secret columns - manual key-value entry
export const GENERIC_SECRET_COLUMNS: SecretColumnDefinition[] = [
  {
    key: "enabled",
    title: "Enabled",
    dataIndex: "enabled",
    type: "checkbox",
    width: 80,
  },
  {
    key: "name",
    title: "Name",
    dataIndex: "name",
    placeholder: "Variable name",
    type: "text",
    required: true,
    helpText: "Name used to reference this secret in requests",
  },
  {
    key: "value",
    title: "Value",
    dataIndex: "value",
    placeholder: "Secret value",
    type: "password",
    required: true,
    helpText: "The secret value (stored locally)",
  },
  {
    key: "environments",
    title: "Environments",
    dataIndex: "environments",
    type: "select",
    width: 200,
    helpText: "Select environments where this secret is applicable",
    options: ENVIRONMENT_OPTIONS,
  },
];

// Map provider type to secret columns
export const PROVIDER_SECRET_COLUMNS: Record<ProviderType, SecretColumnDefinition[]> = {
  [ProviderType.AWS_SECRETS_MANAGER]: AWS_SECRET_COLUMNS,
  [ProviderType.AZURE_KEY_VAULT]: AZURE_SECRET_COLUMNS,
  [ProviderType.HASHICORP_VAULT]: HASHICORP_SECRET_COLUMNS,
  [ProviderType.GENERIC]: GENERIC_SECRET_COLUMNS,
};

// Helper to create a default empty secret for a provider type
export const createDefaultSecret = (type: ProviderType): SecretRow => {
  const now = Date.now();
  const base: SecretRow = {
    id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
    enabled: true,
    name: "",
    value: "",
    environments: [],
    createdAt: now,
    updatedAt: now,
    isNew: true,
  };

  switch (type) {
    case ProviderType.AWS_SECRETS_MANAGER:
      return { ...base, secretNameOrArn: "" };
    case ProviderType.AZURE_KEY_VAULT:
      return { ...base, secretName: "" };
    case ProviderType.HASHICORP_VAULT:
      return { ...base, path: "", key: "" };
    case ProviderType.GENERIC:
    default:
      return base;
  }
};

// Helper to get usage instruction text
export const getSecretsUsageText = (providerName: string): string => {
  return `Use secrets in your requests as $secrets.${providerName.toLowerCase().replace(/\s+/g, "_")}.<name>`;
};
