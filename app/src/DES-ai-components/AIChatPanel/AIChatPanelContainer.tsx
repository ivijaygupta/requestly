// AI Chat Panel Container - Self-contained implementation with FAB and overlay panel

import React, { useCallback } from "react";
import { AIChatPanel } from "./AIChatPanel";
import { FloatingActionButton } from "./FloatingActionButton";
import { useChatStore } from "./hooks/useChatStore";
import { mockAIService } from "./services/mockAIService";
import type { CreateRequestPayload, CreateCollectionPayload } from "./types";

/**
 * Self-contained AI Chat Panel container.
 * Provides the FAB trigger and overlay chat panel.
 * Handles all message processing internally with mock AI.
 */
export const AIChatPanelContainer: React.FC = () => {
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const setProcessing = useChatStore((state) => state.setProcessing);

  // Execute action (create request, collection, etc.)
  const executeAction = useCallback(
    async (
      action: { type: string; payload: any },
      messageId: string
    ): Promise<void> => {
      const { type, payload } = action;

      // Update message to show executing status
      updateMessage(messageId, {
        action: { ...action, status: "executing" } as any,
      });

      // Simulate action execution with logging
      console.log(`[AI Chat] 🎬 Executing action: ${type}`);

      try {
        switch (type) {
          case "create_request": {
            const reqPayload = payload as CreateRequestPayload;
            console.log(`[AI Chat] 📝 Creating request: ${reqPayload.method} ${reqPayload.url}`);
            logRequestCreation(reqPayload);
            break;
          }
          case "create_collection": {
            const colPayload = payload as CreateCollectionPayload;
            console.log(`[AI Chat] 📁 Creating collection: ${colPayload.name}`);
            logCollectionCreation(colPayload);
            break;
          }
          case "modify_request": {
            console.log(`[AI Chat] ✏️ Modifying request:`, payload);
            break;
          }
          default:
            console.log(`[AI Chat] 💡 Action: ${type}`, payload);
        }

        // Simulate completion delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update message with completed status
        updateMessage(messageId, {
          action: {
            ...action,
            status: "completed",
            result: { success: true, message: "Action completed" },
          } as any,
        });
      } catch (error) {
        console.error(`[AI Chat] ❌ Action failed:`, error);
        updateMessage(messageId, {
          action: {
            ...action,
            status: "failed",
            result: { success: false, message: "Action failed" },
          } as any,
        });
      }
    },
    [updateMessage]
  );

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      addMessage({
        role: "user",
        content: content.trim(),
      });

      // Set processing state
      setProcessing(true);

      try {
        // Process with mock AI service
        const response = await mockAIService.processMessage(content);

        // Add AI response message
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
            },
            messageId
          );
        }
      } catch (error) {
        console.error("[AI Chat] Error processing message:", error);
        addMessage({
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        });
      } finally {
        setProcessing(false);
      }
    },
    [addMessage, setProcessing, executeAction]
  );

  return (
    <>
      <FloatingActionButton />
      <AIChatPanel onSendMessage={handleSendMessage} />
    </>
  );
};

// Logging helpers for demo
function logRequestCreation(payload: CreateRequestPayload) {
  const method = payload.method || "GET";
  const url = payload.url || "/api/endpoint";
  const name = payload.name || "Untitled";

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  AI GENERATED REQUEST                                       ║
╠════════════════════════════════════════════════════════════╣
║  Method: ${method.padEnd(50)}║
║  URL: ${url.padEnd(53)}║
║  Name: ${name.padEnd(52)}║
╚════════════════════════════════════════════════════════════╝
  `);
}

function logCollectionCreation(payload: CreateCollectionPayload) {
  const name = payload.name || "Untitled Collection";
  const requests = payload.requests || [];

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  AI GENERATED COLLECTION                                    ║
╠════════════════════════════════════════════════════════════╣
║  Name: ${name.padEnd(52)}║
║  Requests: ${String(requests.length).padEnd(48)}║
╠════════════════════════════════════════════════════════════╣`);

  requests.forEach((req, i) => {
    const reqLine = `${req.method} ${req.url}`.substring(0, 50);
    console.log(`║  ${String(i + 1)}. ${reqLine.padEnd(55)}║`);
  });

  console.log(`╚════════════════════════════════════════════════════════════╝`);
}

export default AIChatPanelContainer;
