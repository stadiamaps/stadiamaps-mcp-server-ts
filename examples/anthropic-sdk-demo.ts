import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  TextBlock,
  ToolUseBlock,
  ContentBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs";
import * as path from "path";

/**
 * An example of how to set up a conversation with an Anthropic LLM,
 * with the Stadia Maps MCP server available to provide context.
 */
class StadiaMapsIntegration {
  private anthropic: Anthropic;
  private mcpClient!: Client;
  private mcpTransport!: StdioClientTransport;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async initialize() {
    // Setup MCP client
    this.mcpTransport = new StdioClientTransport({
      command: "node",
      args: ["../build/index.js"],
      env: { ...process.env, API_KEY: process.env.STADIA_MAPS_API_KEY! },
    });

    this.mcpClient = new Client(
      { name: "stadiamaps-client", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    await this.mcpClient.connect(this.mcpTransport);
    console.log("🗺️  Connected to Stadia Maps MCP server");
  }

  // Core method that leverages MCP's dynamic capabilities
  async ask(question: string) {
    try {
      // Get tools dynamically from the MCP server
      const { tools } = await this.mcpClient.listTools();


      const anthropicTools = tools.filter(({ name }) => {
        // Limit which tools are exposed to save context.
        return name === "time-and-zone-info" || name === "geocode" || name === "route-overview" || name == "static-map";
      }).map(
        ({ name, description, inputSchema }) => ({
          // Convert to Anthropic format (minimal transformation)
          name,
          description,
          input_schema: inputSchema,
        }),
      );

      let messages: MessageParam[] = [{ role: "user", content: question }];

      // Handle conversation with tool calls
      while (true) {
        const response = await this.anthropic.messages.create({
          model: "claude-sonnet-4-0",
          max_tokens: 2048,
          messages,
          tools: anthropicTools,
        });

        // Add assistant response to conversation
        messages.push({ role: "assistant", content: response.content });

        // Check if Claude wants to use tools
        const toolCalls = response.content.filter(
          (c): c is ToolUseBlock => c.type === "tool_use",
        );
        if (toolCalls.length === 0) {
          return response; // No tools needed, we're done
        }

        // Execute all tool calls
        const toolResults = await Promise.all(
          toolCalls.map(async (toolCall) => {
            try {
              console.log(
                `Calling tool '${toolCall.name}' with input:`,
                toolCall.input,
              );
              const result = await this.mcpClient.callTool({
                name: toolCall.name,
                arguments: toolCall.input as Record<string, unknown>,
              });

              // Use structured content if available
              const content = (result as any).structuredContent
                ? JSON.stringify((result as any).structuredContent)
                : processToolResultContent(result.content);

              return {
                tool_use_id: toolCall.id,
                type: "tool_result" as const,
                content: content,
              };
            } catch (error) {
              return {
                tool_use_id: toolCall.id,
                type: "tool_result" as const,
                content: `Error: ${error instanceof Error ? error.message : String(error)}`,
                is_error: true,
              };
            }
          }),
        );

        // Add tool results to the conversation (and then loop around to get the response)
        messages.push({ role: "user", content: toolResults });
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async cleanup() {
    await this.mcpClient?.close();
    await this.mcpTransport?.close();
  }
}

/**
 * Helper function to save base64 image data to disk
 */
function saveBase64Image(base64Data: string, mimeType: string): string {
  // Create a timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const filename = `static-map-${timestamp}.${extension}`;
  const filepath = path.join(process.cwd(), filename);

  // Convert base64 to buffer and save
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

/**
 * Process tool result content, handling both text and image data
 */
function processToolResultContent(content: any): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const results: string[] = [];

    for (const item of content) {
      if (item.type === "image" && item.data && item.mimeType) {
        // Save the image and return the file path info
        const filepath = saveBase64Image(item.data, item.mimeType);
        const message = `📸 Static map image saved to: ${filepath}`;
        console.log(message);
        results.push(message);
      } else {
        // Handle other content types
        console.log("Tool result: ", item);
        results.push(item.type === "text" ? item.text : JSON.stringify(item));
      }
    }

    return results.join("\n");
  }

  return JSON.stringify(content);
}

function extractTextResponse(content: ContentBlock[]) {
  return (
    content.find((c): c is TextBlock => c.type === "text")?.text ||
    "No text response"
  );
}

/**
 * Asks a single question. That is, each message does not include any previous context.
 *
 * @param question Your prompt to the model (e.g. "What time is it in Tokyo?")
 */
async function askSingleQuestion(question: string) {
  const integration = new StadiaMapsIntegration();
  try {
    // One-time setup
    await integration.initialize();

    return await integration.ask(question);
  } finally {
    await integration.cleanup();
  }
}

// Example usage
async function main() {
  console.log("🚀 Starting Stadia Maps + Claude integration examples\n");

  await askSingleQuestion("What time is it in Tokyo?").then((response) => {
      console.log(extractTextResponse(response.content));
  });

  await askSingleQuestion(
    "Make me a map showing the walking route from Depoo Turg to Põhjala Tap Room.",
  ).then((response) => {
    console.log(extractTextResponse(response.content));
  });

  await askSingleQuestion("Is the Põhjala Tap Room open right now? Use Stadia Maps to get this information?").then((response) => {
    console.log(extractTextResponse(response.content));
  });
}

export { askSingleQuestion };

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
