import React, { useMemo, useState } from "react";
import { RequestExecutionResult } from "features/apiClient/store/collectionRunResult/runResult.store";
import { RQAPI } from "features/apiClient/types";
import { MdClose } from "@react-icons/all-files/md/MdClose";
import { MdDataObject } from "@react-icons/all-files/md/MdDataObject";
import { PiTag } from "@react-icons/all-files/pi/PiTag";
import { MdOutlineDescription } from "@react-icons/all-files/md/MdOutlineDescription";
import { cn } from "../lib/utils";
import NetworkStatusField from "components/misc/NetworkStatusField";
import ResponseBody from "features/apiClient/screens/apiClient/components/views/components/response/ResponseBody/ResponseBody";
import ResponseHeaders from "features/apiClient/screens/apiClient/components/views/components/response/ResponseHeaders/ResponseHeaders";
import { KeyValuePair } from "features/apiClient/types";
import Editor from "componentsV2/CodeEditor";
import { EditorLanguage } from "componentsV2/CodeEditor/types";

interface Props {
  result: RequestExecutionResult;
  onClose: () => void;
}

type TabKey = "response" | "headers" | "request";

export const ResultDetailsPanel: React.FC<Props> = ({ result, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("response");

  // Generate dummy response body based on request name/type
  const responseBody = useMemo(() => {
    const dummyResponse = {
      data: [
        { id: 1, title: "Sample Response Item 1", status: "active" },
        { id: 2, title: "Sample Response Item 2", status: "pending" },
        { id: 3, title: "Sample Response Item 3", status: "completed" },
      ],
      meta: {
        total: 3,
        page: 1,
        limit: 10,
      },
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(dummyResponse, null, 2);
  }, []);

  // Generate dummy response headers
  const responseHeaders = useMemo(() => {
    const headers: KeyValuePair[] = [
      { id: 1, key: "content-type", value: "application/json", isEnabled: true },
      { id: 2, key: "content-length", value: "256", isEnabled: true },
      { id: 3, key: "date", value: new Date().toUTCString(), isEnabled: true },
      { id: 4, key: "server", value: "nginx/1.18.0", isEnabled: true },
      { id: 5, key: "cache-control", value: "no-cache", isEnabled: true },
      { id: 6, key: "x-request-id", value: "abc123def456", isEnabled: true },
    ];
    return headers;
  }, []);

  const contentTypeHeader = useMemo(() => {
    const contentType = responseHeaders.find((h) => h.key.toLowerCase() === "content-type");
    return contentType?.value || "application/json";
  }, [responseHeaders]);

  // Generate realistic dummy request details based on request name/type
  // This structure is flexible - when real data becomes available, it can replace the dummy data
  const requestDetails = useMemo(() => {
    const method = result.entry.type === RQAPI.ApiEntryType.GRAPHQL ? "POST" : result.entry.method;
    const baseUrl = "https://api.example.com/v1";
    const endpoint = result.recordName.toLowerCase().replace(/\s+/g, "-");

    // Generate realistic body based on request name/context
    let body: string | undefined;
    let bodyLanguage: EditorLanguage | undefined;
    const requestNameLower = result.recordName.toLowerCase();

    if (method !== "GET" && method !== "HEAD") {
      if (requestNameLower.includes("account") || requestNameLower.includes("create")) {
        body = JSON.stringify(
          {
            owner: "John Doe - Account",
            balance: 0,
            currency: "USD",
          },
          null,
          2
        );
        bodyLanguage = EditorLanguage.JSON;
      } else if (requestNameLower.includes("user") || requestNameLower.includes("register")) {
        body = JSON.stringify(
          {
            name: "John Doe",
            email: "john.doe@example.com",
            role: "user",
          },
          null,
          2
        );
        bodyLanguage = EditorLanguage.JSON;
      } else if (
        requestNameLower.includes("transaction") ||
        requestNameLower.includes("transfer") ||
        requestNameLower.includes("invalid")
      ) {
        body = JSON.stringify(
          {
            fromAccount: "123456",
            toAccount: "789012",
            amount: 100.5,
            currency: "USD",
          },
          null,
          2
        );
        bodyLanguage = EditorLanguage.JSON;
      } else if (requestNameLower.includes("token") || requestNameLower.includes("auth")) {
        body = JSON.stringify(
          {
            grant_type: "client_credentials",
            client_id: "***",
            client_secret: "***",
          },
          null,
          2
        );
        bodyLanguage = EditorLanguage.JSON;
      } else {
        body = JSON.stringify(
          {
            data: {
              key: "value",
              timestamp: new Date().toISOString(),
            },
          },
          null,
          2
        );
        bodyLanguage = EditorLanguage.JSON;
      }
    }

    // Structure is flexible - real data can replace this when available
    return {
      method,
      url: `${baseUrl}/${endpoint}`,
      headers: [
        { id: 1, key: "Accept", value: "application/json", isEnabled: true },
        { id: 2, key: "Content-Type", value: "application/json", isEnabled: true },
        { id: 3, key: "User-Agent", value: "Requestly/1.0", isEnabled: true },
        { id: 4, key: "Authorization", value: "Bearer ***", isEnabled: true },
      ] as KeyValuePair[],
      queryParams:
        method === "GET"
          ? ([
              { id: 1, key: "limit", value: "10", isEnabled: true },
              { id: 2, key: "offset", value: "0", isEnabled: true },
            ] as KeyValuePair[])
          : [],
      body,
      bodyLanguage,
      // Flag to indicate if this is dummy data (for future use when real data is available)
      isDummy: true,
    };
  }, [result]);

  const tabItems = useMemo(() => {
    return [
      {
        key: "response" as TabKey,
        label: (
          <div className="flex items-center gap-2">
            <MdDataObject className="w-4 h-4" />
            <span>Response</span>
          </div>
        ),
      },
      {
        key: "headers" as TabKey,
        label: (
          <div className="flex items-center gap-2">
            <PiTag className="w-4 h-4" />
            <span>Headers</span>
            <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-800 text-zinc-300">{responseHeaders.length}</span>
          </div>
        ),
      },
      {
        key: "request" as TabKey,
        label: (
          <div className="flex items-center gap-2">
            <MdOutlineDescription className="w-4 h-4" />
            <span>Request</span>
          </div>
        ),
      },
    ];
  }, [responseHeaders.length]);

  return (
    <div
      className="absolute inset-y-0 right-0 z-50 w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl"
      style={{
        animation: "slideInFromRight 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-950/50">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            {result.entry.type === RQAPI.ApiEntryType.GRAPHQL ? (
              <span className="px-2 py-0.5 text-xs font-semibold text-zinc-300 bg-zinc-800 rounded uppercase tracking-wide">
                GRAPHQL
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold text-zinc-300 bg-zinc-800 rounded uppercase tracking-wide">
                {result.entry.method}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-zinc-500 text-sm truncate font-medium">{result.collectionName}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-white text-sm font-semibold truncate" title={result.recordName}>
              {result.recordName}
            </span>
          </div>
          {result.entry.statusCode && (
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-zinc-500 text-xs font-mono">
                {result.entry.responseTime ? Math.round(result.entry.responseTime) : 0}ms
              </span>
              <NetworkStatusField status={result.entry.statusCode} statusText={result.entry.statusText || undefined} />
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Close panel"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-6 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/50">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all relative",
              "flex items-center gap-2",
              activeTab === tab.key ? "text-white" : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
            )}
          >
            {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === "response" && (
          <div className="h-full overflow-auto">
            {result.status?.value === RQAPI.ExecutionStatus.ERROR ? (
              <div className="p-6">
                <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/50">
                  <div className="text-red-400 font-medium mb-1">Request Failed</div>
                  <div className="text-red-300 text-sm">{result.status.error.message || "Something went wrong!"}</div>
                </div>
              </div>
            ) : (
              <ResponseBody responseText={responseBody} contentTypeHeader={contentTypeHeader} />
            )}
          </div>
        )}

        {activeTab === "headers" && (
          <div className="h-full overflow-auto">
            <div className="p-6">
              <div className="bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden">
                <ResponseHeaders headers={responseHeaders} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "request" && (
          <div className="h-full overflow-auto">
            {requestDetails ? (
              <div className="p-6 space-y-6">
                {/* Method and URL */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Request</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-600/20 text-indigo-400 rounded border border-indigo-600/30">
                      {requestDetails.method}
                    </span>
                    <span className="text-sm text-zinc-200 font-mono break-all leading-relaxed">
                      {requestDetails.url}
                    </span>
                  </div>
                </div>

                {/* Query Parameters */}
                {requestDetails.queryParams && requestDetails.queryParams.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Query Parameters</div>
                    <div className="bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden">
                      <ResponseHeaders headers={requestDetails.queryParams} />
                    </div>
                  </div>
                )}

                {/* Headers */}
                {requestDetails.headers && requestDetails.headers.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Headers</div>
                    <div className="bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden">
                      <ResponseHeaders headers={requestDetails.headers} />
                    </div>
                  </div>
                )}

                {/* Body */}
                {requestDetails.body && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Body</div>
                    <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                      <Editor
                        value={requestDetails.body}
                        language={requestDetails.bodyLanguage || EditorLanguage.JSON}
                        isReadOnly
                        showOptions={{
                          enablePrettify: true,
                        }}
                        toolbarOptions={{
                          title: "",
                          options: [],
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center py-12">
                  <MdOutlineDescription className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <div className="text-zinc-300 text-sm font-medium mb-2">Request details not available</div>
                  <div className="text-zinc-500 text-xs max-w-md mx-auto">
                    Request data is only available during the request execution. Click on the request name above to view
                    and edit the request details.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
