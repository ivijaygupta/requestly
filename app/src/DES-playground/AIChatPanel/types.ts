// Types for AI Chat Panel

export type MessageRole = "user" | "assistant" | "system";

export type ActionType =
  | "create_request"
  | "modify_request"
  | "create_collection"
  | "explain_response"
  | "general_response";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  action?: AIAction;
  isLoading?: boolean;
}

export interface AIAction {
  type: ActionType;
  payload: AIActionPayload;
  status: "pending" | "executing" | "completed" | "failed";
  result?: AIActionResult;
}

export type AIActionPayload =
  | CreateRequestPayload
  | ModifyRequestPayload
  | CreateCollectionPayload
  | ExplainResponsePayload
  | GeneralResponsePayload;

export interface CreateRequestPayload {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  url: string;
  name?: string;
  headers?: Record<string, string>;
  body?: string;
  queryParams?: Record<string, string>;
}

export interface ModifyRequestPayload {
  requestId?: string;
  modifications: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
    queryParams?: Record<string, string>;
  };
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
  requests: CreateRequestPayload[];
}

export interface ExplainResponsePayload {
  statusCode: number;
  statusText: string;
  responseBody?: string;
}

export interface GeneralResponsePayload {
  message: string;
}

export interface AIActionResult {
  success: boolean;
  message: string;
  data?: {
    recordId?: string;
    collectionId?: string;
  };
}

export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isProcessing: boolean;
  hasUnread: boolean;
  currentRequestContext?: {
    requestId: string;
    method: string;
    url: string;
  };
}

export interface ChatActions {
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setCurrentRequestContext: (context: ChatState["currentRequestContext"]) => void;
  setCurrentAction: (action: AIAction) => void;
  completeAction: (type: ActionType) => void;
  markAsRead: () => void;
}

export type ChatStore = ChatState & ChatActions;

// Intent parsing types
export interface ParsedIntent {
  type: ActionType;
  confidence: number;
  extractedData: Partial<AIActionPayload>;
  originalQuery: string;
}

// Suggestions for the chat input
export interface ChatSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}
