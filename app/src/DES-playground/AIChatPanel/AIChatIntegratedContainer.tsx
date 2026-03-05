// AI Chat Integrated Container - Uses portals to integrate into existing UI

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { AIChatPanelIntegrated } from "./AIChatPanelIntegrated";
import { AIChatFooterButton } from "./AIChatFooterButton";
import { useChatStore, selectIsOpen } from "./hooks/useChatStore";
import { mockAIService } from "./services/mockAIService";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, AIAction, CreateCollectionPayload, CreateRequestPayload } from "./types";
import { getApiClientFeatureContext, saveOrUpdateRecord } from "features/apiClient/commands/store.utils";
import { API_CLIENT_RECORD_ADDED_EVENT } from "features/apiClient/constants";
import { RQAPI, RequestMethod } from "features/apiClient/types";
import { getEmptyApiEntry } from "features/apiClient/screens/apiClient/utils";
import { getDefaultAuth } from "features/apiClient/screens/apiClient/components/views/components/request/components/AuthorizationView/defaults";

/**
 * Integrated AI Chat Container that:
 * 1. Injects a footer button into the existing app footer
 * 2. Renders the chat panel as a sidebar (not overlay)
 */
export const AIChatIntegratedContainer: React.FC = () => {
  const location = useLocation();
  const isApiClientPage = location.pathname.includes("/api-client");
  const isOpen = useChatStore(selectIsOpen);

  const [footerContainer, setFooterContainer] = useState<HTMLElement | null>(null);
  const [mainContentContainer, setMainContentContainer] = useState<HTMLElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Refs to track if we've already set up containers (prevents re-running)
  const footerSetupDone = useRef(false);
  const mainContentSetupDone = useRef(false);

  const addMessage = useChatStore((state) => state.addMessage);
  const setLoading = useChatStore((state) => state.setLoading);
  const setCurrentAction = useChatStore((state) => state.setCurrentAction);
  const completeAction = useChatStore((state) => state.completeAction);
  const setThinkingStep = useChatStore((state) => state.setThinkingStep);

  // Find and prepare DOM containers - runs once
  useEffect(() => {
    if (!isApiClientPage) return;

    let observer: MutationObserver | null = null;

    // Find the footer links container and insert our button before "Documentation"
    const findFooterContainer = () => {
      if (footerSetupDone.current) return true;

      const footerLinks = document.querySelector(".app-footer-links");
      if (footerLinks) {
        // Check if we already have a container
        let aiButtonContainer = document.getElementById("ai-chat-footer-container");
        if (!aiButtonContainer) {
          aiButtonContainer = document.createElement("div");
          aiButtonContainer.id = "ai-chat-footer-container";
          aiButtonContainer.style.display = "contents"; // Doesn't affect layout

          // Insert at the beginning of footer links (before Documentation)
          footerLinks.insertBefore(aiButtonContainer, footerLinks.firstChild);
        }
        footerSetupDone.current = true;
        setFooterContainer(aiButtonContainer);
        return true;
      }
      return false;
    };

    // Find the main content area and create a container for the chat panel
    const findMainContentContainer = () => {
      if (mainContentSetupDone.current) return true;

      const mainContent = document.querySelector(".app-main-content");
      if (mainContent) {
        const mainContentEl = mainContent as HTMLElement;

        // Only set up if not already done
        if (!mainContentEl.hasAttribute("data-ai-chat-setup")) {
          // Store original styles for cleanup
          mainContentEl.setAttribute("data-original-display", mainContentEl.style.display || "");
          mainContentEl.setAttribute("data-original-flex-direction", mainContentEl.style.flexDirection || "");
          mainContentEl.setAttribute("data-ai-chat-setup", "true");

          // Make main content a flex container
          mainContentEl.style.display = "flex";
          mainContentEl.style.flexDirection = "row";
          mainContentEl.style.overflow = "hidden";
        }

        // Check if we already have a container
        let chatContainer = document.getElementById("ai-chat-panel-container");
        if (!chatContainer) {
          chatContainer = document.createElement("div");
          chatContainer.id = "ai-chat-panel-container";
          chatContainer.style.cssText = `
            height: 100%;
            flex-shrink: 0;
            width: 0;
            overflow: hidden;
            transition: width 0.25s ease-in-out;
          `;
          mainContent.appendChild(chatContainer);

          // Ensure the main content children can shrink (make them take remaining space)
          const mainContentChildren = Array.from(mainContentEl.children) as HTMLElement[];
          mainContentChildren.forEach((child) => {
            if (child.id !== "ai-chat-panel-container" && !child.hasAttribute("data-ai-chat-flex-setup")) {
              // Store original styles
              child.setAttribute("data-original-flex", child.style.flex || "");
              child.setAttribute("data-original-min-width", child.style.minWidth || "");
              child.setAttribute("data-original-overflow", child.style.overflow || "");
              child.setAttribute("data-ai-chat-flex-setup", "true");
              // Apply flex styles
              child.style.flex = "1";
              child.style.minWidth = "0";
              child.style.overflow = "hidden";
              child.style.transition = "flex 0.25s ease-in-out";
            }
          });
        }

        mainContentSetupDone.current = true;
        setMainContentContainer(chatContainer);
        return true;
      }
      return false;
    };

    // Initial search
    const footerFound = findFooterContainer();
    const mainContentFound = findMainContentContainer();

    // Only set up observer if we haven't found both containers yet
    if (!footerFound || !mainContentFound) {
      observer = new MutationObserver(() => {
        const f = findFooterContainer();
        const m = findMainContentContainer();
        // Disconnect once both are found
        if (f && m && observer) {
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }

      // Reset refs on cleanup
      footerSetupDone.current = false;
      mainContentSetupDone.current = false;

      // Restore original styles on main content children
      const mainContent = document.querySelector(".app-main-content") as HTMLElement;
      if (mainContent && mainContent.hasAttribute("data-ai-chat-setup")) {
        // Restore main content styles
        mainContent.style.display = mainContent.getAttribute("data-original-display") || "";
        mainContent.style.flexDirection = mainContent.getAttribute("data-original-flex-direction") || "";
        mainContent.removeAttribute("data-ai-chat-setup");
        mainContent.removeAttribute("data-original-display");
        mainContent.removeAttribute("data-original-flex-direction");

        const children = Array.from(mainContent.children) as HTMLElement[];
        children.forEach((child) => {
          if (child.id !== "ai-chat-panel-container" && child.hasAttribute("data-ai-chat-flex-setup")) {
            child.style.flex = child.getAttribute("data-original-flex") || "";
            child.style.minWidth = child.getAttribute("data-original-min-width") || "";
            child.style.overflow = child.getAttribute("data-original-overflow") || "";
            child.style.transition = "";
            child.removeAttribute("data-ai-chat-flex-setup");
            child.removeAttribute("data-original-flex");
            child.removeAttribute("data-original-min-width");
            child.removeAttribute("data-original-overflow");
          }
        });
      }

      // Cleanup containers
      const footerEl = document.getElementById("ai-chat-footer-container");
      if (footerEl) footerEl.remove();
      const panelEl = document.getElementById("ai-chat-panel-container");
      if (panelEl) panelEl.remove();
    };
  }, [isApiClientPage]); // Only depend on isApiClientPage, not the container state

  // Update chat panel container width based on open state
  useEffect(() => {
    if (!mainContentContainer) return;

    if (isOpen) {
      mainContentContainer.style.width = "380px";
      mainContentContainer.style.display = "flex";
    } else {
      mainContentContainer.style.width = "0";
      // Keep it in DOM but hidden
    }
  }, [mainContentContainer, isOpen]);

  // Simulate AI actions with step-by-step delays so the user sees "thought process"
  const simulateAction = useCallback(
    async (action: AIAction) => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      switch (action.type) {
        case "create_request": {
          setCurrentAction({ ...action, step: "Creating request…" });
          console.log(`[AI Chat] 📝 Creating request`);
          await delay(450);
          logRequestCreation(action.payload as any);
          await delay(350);
          break;
        }
        case "create_collection": {
          const payload = action.payload as any;
          setCurrentAction({ ...action, step: "Creating collection…" });
          console.log(`[AI Chat] 📁 Creating collection: ${payload.name}`);
          await delay(500);
          setCurrentAction({ ...action, step: "Adding requests…" });
          await delay(600);
          logCollectionCreation(payload);
          await delay(400);
          break;
        }
        case "modify_request": {
          setCurrentAction({ ...action, step: "Applying changes…" });
          console.log(`[AI Chat] ✏️ Modifying request with:`, action.payload);
          await delay(500);
          break;
        }
        case "explain_response": {
          setCurrentAction({ ...action, step: "Preparing explanation…" });
          await delay(300);
          break;
        }
        default:
          await delay(300);
      }

      completeAction(action.type);
    },
    [setCurrentAction, completeAction]
  );

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };
      addMessage(userMessage);
      setLoading(true);
      setThinkingStep(null);

      try {
        // Process with mock AI service (onThinkingStep drives the "thinking" animation)
        const response = await mockAIService.processMessage(content, {
          onThinkingStep: (step) => setThinkingStep(step),
        });

        // Add AI response message
        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: response.message,
          timestamp: Date.now(),
          action: response.action,
        };
        addMessage(assistantMessage);

        // If there's an action, simulate it
        if (response.action) {
          await simulateAction(response.action);
        }
      } catch (error) {
        console.error("[AI Chat] Error processing message:", error);
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        };
        addMessage(errorMessage);
      } finally {
        setLoading(false);
        setThinkingStep(null);
      }
    },
    [addMessage, setLoading, setThinkingStep, simulateAction]
  );

  // Handle applying an action to the real collection sidebar
  const handleApplyAction = useCallback(async (action: AIAction) => {
    const MIN_LOADING_MS = 1200;
    const REQUEST_STAGGER_MS = 280;

    try {
      // Fake loading state so "Adding..." is visible
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS));

      const context = getApiClientFeatureContext();
      const recordsRepository = context.repositories.apiClientRecordsRepository;

      switch (action.type) {
        case "create_collection": {
          const payload = action.payload as CreateCollectionPayload;

          // 1. Create the collection (appears in sidebar first)
          const collectionRecord: Partial<RQAPI.CollectionRecord> = {
            name: payload.name,
            type: RQAPI.RecordType.COLLECTION,
            data: {
              variables: {},
              auth: getDefaultAuth(false),
            },
            deleted: false,
            collectionId: "",
          };

          const collectionResult = await recordsRepository.createCollection(collectionRecord);
          if (!collectionResult.success) {
            console.error("[AI Chat] Failed to create collection:", collectionResult.message);
            return;
          }

          saveOrUpdateRecord(context, collectionResult.data);
          console.log(`[AI Chat] Collection "${payload.name}" created with ID: ${collectionResult.data.id}`);

          // 2. Create child requests with small delays so they appear gradually
          if (payload.requests && payload.requests.length > 0) {
            for (let i = 0; i < payload.requests.length; i++) {
              if (i > 0) await new Promise((r) => setTimeout(r, REQUEST_STAGGER_MS));
              const reqPayload = payload.requests[i];
              const apiEntry = getEmptyApiEntry(RQAPI.ApiEntryType.HTTP);
              if ("request" in apiEntry) {
                apiEntry.request.url = reqPayload.url;
                apiEntry.request.method = reqPayload.method as RequestMethod;
                if (reqPayload.headers) {
                  apiEntry.request.headers = Object.entries(reqPayload.headers).map(([key, value], index) => ({
                    id: index,
                    key,
                    value,
                    isEnabled: true,
                  }));
                }
                if (reqPayload.body) {
                  apiEntry.request.body = reqPayload.body;
                }
              }

              const requestRecord: Partial<RQAPI.ApiRecord> = {
                name: reqPayload.name || `${reqPayload.method} ${reqPayload.url}`,
                type: RQAPI.RecordType.API,
                data: apiEntry,
                deleted: false,
                collectionId: collectionResult.data.id,
              };

              const reqResult = await recordsRepository.createRecord(requestRecord);
              if (reqResult.success) {
                saveOrUpdateRecord(context, reqResult.data);
                console.log(`[AI Chat]   Request "${reqPayload.name}" added to collection`);
              }
            }
          }

          window.dispatchEvent(
            new CustomEvent(API_CLIENT_RECORD_ADDED_EVENT, { detail: { collectionId: collectionResult.data.id } })
          );
          break;
        }

        case "create_request": {
          const payload = action.payload as CreateRequestPayload;

          const apiEntry = getEmptyApiEntry(RQAPI.ApiEntryType.HTTP);
          if ("request" in apiEntry) {
            apiEntry.request.url = payload.url;
            apiEntry.request.method = payload.method as RequestMethod;
            if (payload.headers) {
              apiEntry.request.headers = Object.entries(payload.headers).map(([key, value], index) => ({
                id: index,
                key,
                value,
                isEnabled: true,
              }));
            }
            if (payload.body) {
              apiEntry.request.body = payload.body;
            }
          }

          const requestRecord: Partial<RQAPI.ApiRecord> = {
            name: payload.name || `${payload.method} ${payload.url}`,
            type: RQAPI.RecordType.API,
            data: apiEntry,
            deleted: false,
            collectionId: "",
          };

          const result = await recordsRepository.createRecord(requestRecord);
          if (result.success) {
            saveOrUpdateRecord(context, result.data);
            console.log(`[AI Chat] Request "${payload.name}" created with ID: ${result.data.id}`);
            window.dispatchEvent(
              new CustomEvent(API_CLIENT_RECORD_ADDED_EVENT, { detail: { requestId: result.data.id } })
            );
          } else {
            console.error("[AI Chat] Failed to create request:", result.message);
          }
          break;
        }
      }
    } catch (error) {
      console.error("[AI Chat] Error applying action:", error);
      throw error;
    }
  }, []);

  // Don't render anything if not on API client page
  if (!isApiClientPage) {
    return null;
  }

  return (
    <>
      {/* Footer button portal */}
      {footerContainer && createPortal(<AIChatFooterButton />, footerContainer)}

      {/* Chat panel portal - always rendered but width controlled by container */}
      {mainContentContainer &&
        createPortal(
          <div ref={chatPanelRef} style={{ height: "100%", width: "100%" }}>
            <AIChatPanelIntegrated onSendMessage={handleSendMessage} onApplyAction={handleApplyAction} />
          </div>,
          mainContentContainer
        )}
    </>
  );
};

// Logging helpers for demo purposes
function logRequestCreation(payload: any) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  AI GENERATED REQUEST                                       ║
║  Method: ${payload.method.padEnd(50)}║
║  URL: ${payload.url.padEnd(53)}║
║  Name: ${(payload.name || "Untitled").padEnd(52)}║
╚════════════════════════════════════════════════════════════╝
  `);
}

function logCollectionCreation(payload: any) {
  const requestCount = payload.requests?.length || 0;
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  AI GENERATED COLLECTION                                    ║
║  Name: ${payload.name.padEnd(52)}║
║  Requests: ${String(requestCount).padEnd(48)}║
╠════════════════════════════════════════════════════════════╣`);

  payload.requests?.forEach((req: any, i: number) => {
    console.log(`║  ${String(i + 1)}. ${req.method} ${req.url.substring(0, 45).padEnd(50)}║`);
  });

  console.log(`╚════════════════════════════════════════════════════════════╝`);
}

export default AIChatIntegratedContainer;
