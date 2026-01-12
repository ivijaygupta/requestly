// Constants for AI Chat Panel

import type { ChatSuggestion } from "./types";

export const CHAT_PANEL_WIDTH = 420;
export const CHAT_PANEL_MIN_WIDTH = 320;
export const CHAT_PANEL_MAX_WIDTH = 600;

export const KEYBOARD_SHORTCUT = {
  key: "a",
  modifiers: ["meta", "shift"] as const,
  displayText: "⌘⇧A",
};

export const ANIMATION_DURATION = 300;

export const DEFAULT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: "create-get",
    label: "Create GET request",
    prompt: "Create a GET request to /api/users",
    icon: "plus",
  },
  {
    id: "create-post",
    label: "Create POST request",
    prompt: "Create a POST request to /api/products",
    icon: "plus",
  },
  {
    id: "crud-collection",
    label: "Generate CRUD collection",
    prompt: "Generate a CRUD collection for users",
    icon: "folder",
  },
  {
    id: "explain-error",
    label: "Explain 401 error",
    prompt: "What does a 401 error mean?",
    icon: "help",
  },
];

export const WELCOME_MESSAGE = {
  role: "assistant" as const,
  content: `Hey! 👋 I'm your API assistant. Try these commands:

**Create requests:**
• "Create a GET request to /api/users"
• "POST request to /api/products"

**Generate collections:**
• "CRUD collection for users"
• "Generate collection for orders"

**Explain errors:**
• "What does 401 mean?"
• "Explain 500 error"

**Modify requests:**
• "Add authorization header"

Just type what you need!`,
};

export const LOADING_MESSAGES = [
  "Thinking...",
  "Processing your request...",
  "Working on it...",
  "Almost there...",
];

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export const COMMON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: "Bearer <token>",
};
