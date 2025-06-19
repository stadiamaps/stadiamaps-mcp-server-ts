import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Options for configuring error handling behavior
 */
export interface ErrorHandlerOptions {
  /** Context message to prefix the error (e.g., "Geocoding failed", "Route calculation failed") */
  contextMessage: string;
  /** Whether to log errors to the console (default: false) */
  enableLogging?: boolean;
  /** Custom error message formatter function */
  formatError?: (error: unknown) => string;
}

/**
 * Default error message formatter that handles different error types
 */
function defaultErrorFormatter(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  // For HTTP errors or other objects, try to extract meaningful information
  if (typeof error === "object" && error !== null) {
    // Handle fetch Response errors
    if ("status" in error && "statusText" in error) {
      return `HTTP ${error.status}: ${error.statusText}`;
    }

    // Handle objects with message property
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    // Handle objects with error property
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
  }

  // Fallback to JSON stringify for complex objects
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

/**
 * Centralized error handler that wraps async functions and returns standardized CallToolResult.
 *
 * @param asyncFn - The async function to execute that might throw
 * @param options - Error handling options
 * @returns Promise<CallToolResult> - Either the result from asyncFn or a standardized error result
 */
export async function handleToolError<T extends CallToolResult>(
  asyncFn: () => Promise<T>,
  options: ErrorHandlerOptions,
): Promise<CallToolResult> {
  const {
    contextMessage,
    enableLogging: shouldLog = false,
    formatError = defaultErrorFormatter,
  } = options;

  try {
    return await asyncFn();
  } catch (error) {
    if (shouldLog) {
      console.error(`${contextMessage}:`, error);
    }

    const errorMessage = formatError(error);

    return {
      content: [
        {
          type: "text",
          text: `${contextMessage}: ${errorMessage}`,
        },
      ],
    };
  }
}
