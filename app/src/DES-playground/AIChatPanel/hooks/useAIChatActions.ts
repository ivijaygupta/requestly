// Hook to handle AI chat actions and integrate with API client

import { useCallback } from "react";
import { useChatStore } from "./useChatStore";
import { parseIntent, generateResponse } from "../services/mockAIService";
import type { AIAction, CreateRequestPayload, CreateCollectionPayload } from "../types";

interface UseAIChatActionsOptions {
  // Callback when a request should be created
  onCreateRequest?: (payload: CreateRequestPayload) => Promise<{ success: boolean; recordId?: string }>;
  // Callback when a collection should be created
  onCreateCollection?: (payload: CreateCollectionPayload) => Promise<{ success: boolean; collectionId?: string }>;
  // Callback when a request should be modified
  onModifyRequest?: (requestId: string, modifications: Record<string, any>) => Promise<{ success: boolean }>;
}

export const useAIChatActions = (options: UseAIChatActionsOptions = {}) => {
  const { onCreateRequest, onCreateCollection, onModifyRequest } = options;
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const setProcessing = useChatStore((state) => state.setProcessing);
  const currentRequestContext = useChatStore((state) => state.currentRequestContext);

  const executeAction = useCallback(
    async (action: AIAction, messageId: string): Promise<void> => {
      const { type, payload } = action;

      // Update message to show executing status
      updateMessage(messageId, {
        action: { ...action, status: "executing" },
      });

      try {
        let result: { success: boolean; recordId?: string; collectionId?: string } = { success: false };

        switch (type) {
          case "create_request":
            if (onCreateRequest) {
              result = await onCreateRequest(payload as CreateRequestPayload);
            } else {
              // Mock success if no handler provided
              console.log("[AI Chat] Would create request:", payload);
              result = { success: true, recordId: `mock_${Date.now()}` };
            }
            break;

          case "create_collection":
            if (onCreateCollection) {
              result = await onCreateCollection(payload as CreateCollectionPayload);
            } else {
              // Mock success if no handler provided
              console.log("[AI Chat] Would create collection:", payload);
              result = { success: true, collectionId: `mock_col_${Date.now()}` };
            }
            break;

          case "modify_request":
            if (onModifyRequest && currentRequestContext?.requestId) {
              result = await onModifyRequest(currentRequestContext.requestId, (payload as any).modifications);
            } else {
              console.log("[AI Chat] Would modify request:", payload);
              result = { success: true };
            }
            break;

          default:
            // No action needed for explain_response and general_response
            result = { success: true };
        }

        // Update message with result
        updateMessage(messageId, {
          action: {
            ...action,
            status: result.success ? "completed" : "failed",
            result: {
              success: result.success,
              message: result.success ? "Action completed successfully" : "Action failed",
              data: {
                recordId: result.recordId,
                collectionId: result.collectionId,
              },
            },
          },
        });
      } catch (error) {
        console.error("[AI Chat] Action execution failed:", error);
        updateMessage(messageId, {
          action: {
            ...action,
            status: "failed",
            result: {
              success: false,
              message: error instanceof Error ? error.message : "Unknown error occurred",
            },
          },
        });
      }
    },
    [onCreateRequest, onCreateCollection, onModifyRequest, currentRequestContext, updateMessage]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message
      addMessage({
        role: "user",
        content,
      });

      // Set processing state
      setProcessing(true);

      try {
        // Parse intent and generate response
        const intent = parseIntent(content);
        const response = await generateResponse(intent);

        // Add assistant message
        const messageId = addMessage({
          role: "assistant",
          content: response.message,
          action: response.action
            ? {
                type: response.action.type,
                payload: response.action.payload,
                status: "pending",
              }
            : undefined,
        });

        // Execute action if present
        if (response.action) {
          await executeAction(
            {
              type: response.action.type,
              payload: response.action.payload,
              status: "pending",
            },
            messageId
          );
        }
      } catch (error) {
        console.error("[AI Chat] Error processing message:", error);
        addMessage({
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        });
      } finally {
        setProcessing(false);
      }
    },
    [addMessage, setProcessing, executeAction]
  );

  return {
    sendMessage,
  };
};
