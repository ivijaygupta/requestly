// Zustand store for AI Chat Panel state management

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChatStore, ChatMessage, ChatState } from "../types";
import { WELCOME_MESSAGE } from "../constants";

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const initialState: ChatState = {
  isOpen: false,
  messages: [
    {
      id: generateId(),
      role: WELCOME_MESSAGE.role,
      content: WELCOME_MESSAGE.content,
      timestamp: Date.now(),
    },
  ],
  isProcessing: false,
  currentRequestContext: undefined,
  hasUnread: false,
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      togglePanel: () => {
        set((state) => ({ isOpen: !state.isOpen }), false, "togglePanel");
      },

      openPanel: () => {
        set({ isOpen: true }, false, "openPanel");
      },

      closePanel: () => {
        set({ isOpen: false }, false, "closePanel");
      },

      addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => {
        const id = generateId();
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: Date.now(),
        };

        set(
          (state) => ({
            messages: [...state.messages, newMessage],
          }),
          false,
          "addMessage"
        );

        return id;
      },

      updateMessage: (id: string, updates: Partial<ChatMessage>) => {
        set(
          (state) => ({
            messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
          }),
          false,
          "updateMessage"
        );
      },

      removeMessage: (id: string) => {
        set(
          (state) => ({
            messages: state.messages.filter((msg) => msg.id !== id),
          }),
          false,
          "removeMessage"
        );
      },

      clearMessages: () => {
        set(
          {
            messages: [
              {
                id: generateId(),
                role: WELCOME_MESSAGE.role,
                content: WELCOME_MESSAGE.content,
                timestamp: Date.now(),
              },
            ],
          },
          false,
          "clearMessages"
        );
      },

      setProcessing: (isProcessing: boolean) => {
        set({ isProcessing }, false, "setProcessing");
      },

      setCurrentRequestContext: (context: ChatState["currentRequestContext"]) => {
        set({ currentRequestContext: context }, false, "setCurrentRequestContext");
      },

      setLoading: (isLoading: boolean) => {
        set({ isProcessing: isLoading }, false, "setLoading");
      },

      setCurrentAction: (action) => {
        const { messages } = get();
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          set(
            (state) => ({
              messages: state.messages.map((msg) =>
                msg.id === lastMessage.id ? { ...msg, action: { ...action, status: "executing" } } : msg
              ),
            }),
            false,
            "setCurrentAction"
          );
        }
      },

      completeAction: (type) => {
        const { messages } = get();
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant" && lastMessage.action) {
          set(
            (state) => ({
              messages: state.messages.map((msg) =>
                msg.id === lastMessage.id && msg.action
                  ? { ...msg, action: { ...msg.action, status: "completed" } }
                  : msg
              ),
            }),
            false,
            "completeAction"
          );
        }
      },

      markAsRead: () => {
        set({ hasUnread: false }, false, "markAsRead");
      },
    }),
    { name: "ai-chat-store" }
  )
);

// Selectors for optimized re-renders
export const selectIsOpen = (state: ChatStore) => state.isOpen;
export const selectMessages = (state: ChatStore) => state.messages;
export const selectIsProcessing = (state: ChatStore) => state.isProcessing;
export const selectCurrentRequestContext = (state: ChatStore) => state.currentRequestContext;
export const selectHasUnread = (state: ChatStore) => state.hasUnread;
