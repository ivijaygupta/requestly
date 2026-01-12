// AI Chat Panel - Main exports

export { AIChatPanel } from "./AIChatPanel";
export { AIChatPanelContainer } from "./AIChatPanelContainer";
export { FloatingActionButton } from "./FloatingActionButton";
export { useChatStore } from "./hooks/useChatStore";
export { useAIChatActions } from "./hooks/useAIChatActions";
export type {
  ChatMessage,
  ChatState,
  ChatStore,
  AIAction,
  ActionType,
  ParsedIntent,
  ChatSuggestion,
  CreateRequestPayload,
  CreateCollectionPayload,
  ModifyRequestPayload,
} from "./types";
export { KEYBOARD_SHORTCUT, DEFAULT_SUGGESTIONS } from "./constants";
