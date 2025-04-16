import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { PerforceCommands } from "../PerforceCommands";

const server = new Server({
  name: "p4-mcp-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: [{
        name: "calculate_sum",
        description: "Add two numbers together",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" }
          },
          required: ["a", "b"],
          additionalProperties: false
        }
      }]
    };
  });
  
  server.setRequestHandler(CallToolRequestSchema, (request) => {
    console.error('Incoming tool request:', JSON.stringify(request, null, 2));
    if (request.params.name === "calculate_sum") {
      if (!request.params.arguments || typeof request.params.arguments !== 'object') {
        throw new McpError(ErrorCode.MethodNotFound, "Invalid arguments");
      }
      const { a, b } = request.params.arguments;
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new McpError(ErrorCode.MethodNotFound, "Arguments must be numbers");
      }
      return { toolResult: a + b };
    }
    throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
  });

const transport = new StdioServerTransport();

async function main() {
  await server.connect(transport);
}

main().catch(console.error);
