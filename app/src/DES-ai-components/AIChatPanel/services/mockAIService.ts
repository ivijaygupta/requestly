// Mock AI Service - Parses user intent and generates realistic responses

import type {
  ParsedIntent,
  ActionType,
  CreateRequestPayload,
  CreateCollectionPayload,
  ModifyRequestPayload,
  ExplainResponsePayload,
  GeneralResponsePayload,
  AIActionPayload,
} from "../types";
import { HTTP_METHODS } from "../constants";

// Response structure from AI service
export interface AIServiceResponse {
  message: string;
  action?: {
    type: ActionType;
    payload: AIActionPayload;
    status: "pending";
  };
}

// Simulated delay for realistic feel
const simulateDelay = (ms: number = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 400));

/**
 * Parse user message to determine intent and extract relevant data
 */
export const parseIntent = (message: string): ParsedIntent => {
  const lowerMessage = message.toLowerCase().trim();

  // === CRUD COLLECTION DETECTION (check first - highest priority) ===
  if (
    lowerMessage.includes("crud") ||
    (lowerMessage.includes("collection") &&
      (lowerMessage.includes("generate") ||
        lowerMessage.includes("create") ||
        lowerMessage.includes("make") ||
        lowerMessage.includes("build")))
  ) {
    // Try to extract resource name
    let resourceName = "users"; // Default resource

    // Pattern: "for X", "of X", "X collection", "X api"
    const forMatch = lowerMessage.match(/(?:for|of|manage|managing)\s+(\w+)/i);
    const resourceMatch = lowerMessage.match(
      /(\w+)\s+(?:collection|api|crud|endpoints)/i
    );

    if (forMatch) {
      resourceName = forMatch[1];
    } else if (
      resourceMatch &&
      !["crud", "a", "the", "generate", "create", "make"].includes(
        resourceMatch[1]
      )
    ) {
      resourceName = resourceMatch[1];
    }

    return {
      type: "create_collection",
      confidence: 0.95,
      extractedData: generateCRUDCollection(resourceName),
      originalQuery: message,
    };
  }

  // === CREATE REQUEST DETECTION ===
  const methodMatch = lowerMessage.match(
    /\b(get|post|put|patch|delete|head|options)\b/i
  );
  const hasRequestKeyword =
    lowerMessage.includes("request") ||
    lowerMessage.includes("endpoint") ||
    lowerMessage.includes("api");
  const hasCreateKeyword =
    lowerMessage.includes("create") ||
    lowerMessage.includes("make") ||
    lowerMessage.includes("add") ||
    lowerMessage.includes("new");

  // URL detection patterns
  const urlPatterns = [
    /(?:to|for|at|endpoint)\s+["`']?([\/\w\-\.:]+)["`']?/i,
    /(\/[\w\-\/\.:]+)/i,
    /(https?:\/\/[\w\-\.\/\:]+)/i,
  ];

  if (methodMatch || (hasRequestKeyword && hasCreateKeyword)) {
    const method = (methodMatch?.[1]?.toUpperCase() ||
      "GET") as CreateRequestPayload["method"];
    let url = "/api/endpoint";

    for (const pattern of urlPatterns) {
      const match = message.match(pattern);
      if (match) {
        url = normalizeUrl(match[1].trim());
        break;
      }
    }

    // If no URL found but there's a resource mentioned
    const resourceMatch = lowerMessage.match(
      /(?:to|for)\s+(?:get|fetch|retrieve|list|create|update|delete)?\s*(\w+)/i
    );
    if (resourceMatch && url === "/api/endpoint") {
      url = `/api/${resourceMatch[1].toLowerCase()}`;
    }

    return {
      type: "create_request",
      confidence: 0.9,
      extractedData: {
        method,
        url,
        name: `${method} ${url.split("/").pop() || "request"}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      } as CreateRequestPayload,
      originalQuery: message,
    };
  }

  // === MODIFY REQUEST DETECTION ===
  const modifyKeywords = ["add", "set", "change", "update", "modify", "include"];
  const hasModifyKeyword = modifyKeywords.some((k) => lowerMessage.includes(k));
  const hasHeaderKeyword =
    lowerMessage.includes("header") ||
    lowerMessage.includes("authorization") ||
    lowerMessage.includes("auth") ||
    lowerMessage.includes("token");

  if (hasModifyKeyword && hasHeaderKeyword) {
    return {
      type: "modify_request",
      confidence: 0.8,
      extractedData: parseModification(message),
      originalQuery: message,
    };
  }

  // === EXPLAIN ERROR DETECTION ===
  const statusCodeMatch = lowerMessage.match(/\b(\d{3})\b/);
  const hasExplainKeyword =
    lowerMessage.includes("explain") ||
    lowerMessage.includes("what") ||
    lowerMessage.includes("why") ||
    lowerMessage.includes("mean") ||
    lowerMessage.includes("error");

  if (statusCodeMatch && hasExplainKeyword) {
    const statusCode = parseInt(statusCodeMatch[1]);
    if (statusCode >= 100 && statusCode < 600) {
      return {
        type: "explain_response",
        confidence: 0.9,
        extractedData: {
          statusCode,
          statusText: getStatusText(statusCode),
        } as ExplainResponsePayload,
        originalQuery: message,
      };
    }
  }

  // === GENERAL RESPONSE (fallback) ===
  return {
    type: "general_response",
    confidence: 0.5,
    extractedData: {
      message: message,
    } as GeneralResponsePayload,
    originalQuery: message,
  };
};

/**
 * Generate AI response based on parsed intent
 */
export const generateResponse = async (
  intent: ParsedIntent
): Promise<AIServiceResponse> => {
  await simulateDelay();

  switch (intent.type) {
    case "create_request": {
      const payload = intent.extractedData as CreateRequestPayload;
      return {
        message: `I'll create a **${payload.method}** request to \`${payload.url}\`.\n\nThis request will be added to your workspace. You can then customize the headers, body, and other parameters as needed.`,
        action: {
          type: "create_request",
          payload: {
            ...payload,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          } as CreateRequestPayload,
          status: "pending",
        },
      };
    }

    case "create_collection": {
      const payload = intent.extractedData as CreateCollectionPayload;
      return {
        message:
          `I'll create a **${payload.name}** collection with the following endpoints:\n\n` +
          payload.requests
            .map((r) => `• **${r.method}** \`${r.url}\` - ${r.name}`)
            .join("\n") +
          `\n\nThis will set up a complete CRUD structure for your resource.`,
        action: {
          type: "create_collection",
          payload,
          status: "pending",
        },
      };
    }

    case "modify_request": {
      const payload = intent.extractedData as ModifyRequestPayload;
      return {
        message:
          `I'll modify the current request with the following changes:\n\n` +
          Object.entries(payload.modifications)
            .map(
              ([key, value]) =>
                `• **${key}**: ${typeof value === "object" ? JSON.stringify(value) : value}`
            )
            .join("\n") +
          `\n\nPlease make sure you have a request open to apply these changes.`,
        action: {
          type: "modify_request",
          payload,
          status: "pending",
        },
      };
    }

    case "explain_response": {
      const payload = intent.extractedData as ExplainResponsePayload;
      const explanation = getStatusExplanation(payload.statusCode);
      return {
        message: explanation,
        // No action for explanations - just informational
      };
    }

    default: {
      return {
        message: getGeneralResponse(intent.originalQuery),
      };
    }
  }
};

// Helper functions

function normalizeUrl(url: string): string {
  // Remove quotes if present
  url = url.replace(/["']/g, "").trim();

  // Add leading slash if not present and doesn't look like full URL
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("/")
  ) {
    // Check if it looks like a path
    if (url.startsWith("api/") || url.includes("/api/")) {
      url = "/" + url;
    } else if (!url.includes(".")) {
      url = "/" + url;
    } else {
      url = "https://" + url;
    }
  }

  return url;
}

function generateCRUDCollection(resourceName: string): CreateCollectionPayload {
  const singular = resourceName.replace(/s$/, "");
  const plural = resourceName.endsWith("s") ? resourceName : resourceName + "s";
  const basePath = `/api/${plural.toLowerCase()}`;

  return {
    name: `${capitalize(plural)} API`,
    description: `CRUD operations for ${plural}`,
    requests: [
      {
        method: "GET",
        url: basePath,
        name: `List ${plural}`,
        headers: { Accept: "application/json" },
      },
      {
        method: "GET",
        url: `${basePath}/:id`,
        name: `Get ${singular}`,
        headers: { Accept: "application/json" },
      },
      {
        method: "POST",
        url: basePath,
        name: `Create ${singular}`,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: "", description: "" }, null, 2),
      },
      {
        method: "PUT",
        url: `${basePath}/:id`,
        name: `Update ${singular}`,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: "", description: "" }, null, 2),
      },
      {
        method: "DELETE",
        url: `${basePath}/:id`,
        name: `Delete ${singular}`,
        headers: { Accept: "application/json" },
      },
    ],
  };
}

function parseModification(message: string): ModifyRequestPayload {
  const lowerMessage = message.toLowerCase();
  const modifications: ModifyRequestPayload["modifications"] = {};

  // Check for header modifications
  if (
    lowerMessage.includes("header") ||
    lowerMessage.includes("authorization") ||
    lowerMessage.includes("auth") ||
    lowerMessage.includes("token")
  ) {
    const headerMatch = message.match(
      /(\w+[-\w]*)\s*(?:header|:)\s*(?:to\s+)?["']?([^"'\n]+)["']?/i
    );
    if (headerMatch) {
      modifications.headers = { [headerMatch[1]]: headerMatch[2].trim() };
    } else if (
      lowerMessage.includes("authorization") ||
      lowerMessage.includes("auth") ||
      lowerMessage.includes("bearer")
    ) {
      modifications.headers = { Authorization: "Bearer <your-token-here>" };
    } else if (
      lowerMessage.includes("content-type") ||
      lowerMessage.includes("content type")
    ) {
      modifications.headers = { "Content-Type": "application/json" };
    } else if (
      lowerMessage.includes("api-key") ||
      lowerMessage.includes("api key") ||
      lowerMessage.includes("apikey")
    ) {
      modifications.headers = { "X-API-Key": "<your-api-key>" };
    } else {
      // Default to Authorization header
      modifications.headers = { Authorization: "Bearer <your-token-here>" };
    }
  }

  // Check for method changes
  if (lowerMessage.includes("method")) {
    const methodMatch = message.match(/(?:method\s+(?:to\s+)?|to\s+)(\w+)/i);
    if (
      methodMatch &&
      HTTP_METHODS.includes(methodMatch[1].toUpperCase() as any)
    ) {
      modifications.method = methodMatch[1].toUpperCase();
    }
  }

  // Check for URL changes
  if (lowerMessage.includes("url")) {
    const urlMatch = message.match(/url\s+(?:to\s+)?["']?([^\s"']+)["']?/i);
    if (urlMatch) {
      modifications.url = normalizeUrl(urlMatch[1]);
    }
  }

  return { modifications };
}

function getStatusText(code: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[code] || "Unknown Status";
}

function getStatusExplanation(code: number): string {
  const explanations: Record<number, string> = {
    200: `**200 OK** means the request succeeded! 🎉\n\nThe server successfully processed your request and returned the expected data. This is the most common success response.`,

    201: `**201 Created** indicates successful creation! ✨\n\nThe server successfully created a new resource. You'll typically see this after a successful POST request that creates something new.`,

    204: `**204 No Content** means success with no body.\n\nThe server processed the request successfully but isn't returning any content. Common for DELETE operations or updates where no response body is needed.`,

    400: `**400 Bad Request** indicates a client-side error. ⚠️\n\n**Common causes:**\n• Invalid JSON syntax in the request body\n• Missing required fields\n• Invalid data types or formats\n• Malformed URL parameters\n\n**How to fix:**\n1. Check your request body syntax\n2. Verify all required fields are included\n3. Ensure data types match the API specification`,

    401: `**401 Unauthorized** means authentication failed. 🔐\n\n**Common causes:**\n• Missing authentication token\n• Expired token\n• Invalid credentials\n• Wrong authentication method\n\n**How to fix:**\n1. Check if you've included the Authorization header\n2. Verify your token hasn't expired\n3. Ensure you're using the correct authentication scheme (Bearer, Basic, etc.)`,

    403: `**403 Forbidden** means access denied. 🚫\n\n**Common causes:**\n• Insufficient permissions\n• Accessing a resource you don't own\n• IP restrictions\n• Rate limiting\n\n**How to fix:**\n1. Verify you have the required permissions\n2. Check if you're accessing the correct resource\n3. Contact the API administrator if you believe this is an error`,

    404: `**404 Not Found** means the resource doesn't exist. 🔍\n\n**Common causes:**\n• Incorrect URL or endpoint\n• Resource was deleted\n• Typo in the resource ID\n• Resource never existed\n\n**How to fix:**\n1. Double-check the URL spelling\n2. Verify the resource ID is correct\n3. Ensure the endpoint exists in the API`,

    405: `**405 Method Not Allowed** means wrong HTTP method. 🚦\n\nYou're using an HTTP method (GET, POST, PUT, etc.) that isn't supported for this endpoint.\n\n**How to fix:**\n1. Check the API documentation for allowed methods\n2. Common mistakes: using GET instead of POST for creation, or PUT instead of PATCH`,

    429: `**429 Too Many Requests** means you're rate limited. 🐌\n\nYou've exceeded the API's rate limit.\n\n**How to fix:**\n1. Wait before making more requests\n2. Implement exponential backoff\n3. Check the Retry-After header for wait time\n4. Consider upgrading your API plan`,

    500: `**500 Internal Server Error** is a server-side problem. 💥\n\nThe server encountered an unexpected condition. This is **not your fault** - it's an issue on the server side.\n\n**What you can do:**\n1. Wait and retry the request\n2. Check if the service is having issues\n3. Report the error to the API provider with your request details`,

    502: `**502 Bad Gateway** indicates a proxy/gateway error. 🌐\n\nAn intermediate server received an invalid response from the upstream server.\n\n**What you can do:**\n1. Wait and retry\n2. Check the service status page\n3. The issue is usually temporary`,

    503: `**503 Service Unavailable** means the server is temporarily unavailable. 🔧\n\n**Common causes:**\n• Server maintenance\n• Server overloaded\n• Deployment in progress\n\n**What you can do:**\n1. Wait and retry\n2. Check the Retry-After header\n3. Monitor the service status page`,

    504: `**504 Gateway Timeout** means the upstream server didn't respond in time. ⏱️\n\nThe gateway/proxy didn't receive a timely response.\n\n**Possible causes:**\n• Slow server processing\n• Network issues\n• High server load\n\n**What you can do:**\n1. Retry the request\n2. Check if the request involves heavy processing\n3. Contact support if persistent`,
  };

  return (
    explanations[code] ||
    `**${code} ${getStatusText(code)}** is an HTTP status code.\n\nI don't have detailed information about this specific code, but you can check the HTTP specification or the API documentation for more details.`
  );
}

function getGeneralResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("help") || lowerQuery.includes("what can you do")) {
    return (
      `I can help you with various API-related tasks:\n\n` +
      `• **Create requests** - "Create a GET request to /api/users"\n` +
      `• **Generate collections** - "Generate a CRUD collection for products"\n` +
      `• **Modify requests** - "Add an Authorization header"\n` +
      `• **Explain errors** - "What does a 401 error mean?"\n\n` +
      `Just tell me what you'd like to do!`
    );
  }

  if (lowerQuery.includes("thank")) {
    return `You're welcome! 😊 Let me know if you need anything else.`;
  }

  if (
    lowerQuery.includes("hello") ||
    lowerQuery.includes("hi") ||
    lowerQuery.includes("hey")
  ) {
    return `Hello! 👋 How can I help you with your API requests today?\n\nTry saying:\n• "Create a GET request to /api/users"\n• "Generate CRUD collection for products"\n• "What does 404 mean?"`;
  }

  // More helpful fallback with specific examples
  return (
    `I'd be happy to help! Here are some things you can try:\n\n` +
    `**Create a request:**\n` +
    `• "Create a GET request to /api/users"\n` +
    `• "POST request to /api/products"\n\n` +
    `**Generate a collection:**\n` +
    `• "CRUD collection for users"\n` +
    `• "Generate collection for orders"\n\n` +
    `**Explain errors:**\n` +
    `• "What does 401 mean?"\n` +
    `• "Explain 500 error"\n\n` +
    `**Modify requests:**\n` +
    `• "Add authorization header"`
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Main mock AI service object with processMessage method
 */
export const mockAIService = {
  parseIntent,
  generateResponse,

  /**
   * Process a user message and return the AI response with optional action
   */
  processMessage: async (message: string): Promise<AIServiceResponse> => {
    const intent = parseIntent(message);
    const response = await generateResponse(intent);
    return response;
  },
};
