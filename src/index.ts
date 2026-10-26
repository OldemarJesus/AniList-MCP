#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.js";
import { createMcpServer } from "./server.js";
import { createHttpApp } from "./http.js";

async function main() {
  const args = process.argv.slice(2);
  let mode = config.transport;

  if (args.includes("--stdio")) {
    mode = "stdio";
  } else if (args.includes("--sse")) {
    mode = "sse";
  }

  const activeConfig = { ...config, transport: mode };
  const { server, anilist } = createMcpServer(activeConfig);

  if (mode === "sse") {
    const { app } = createHttpApp(server, anilist, activeConfig);

    const httpServer = app.listen(activeConfig.port, activeConfig.host, () => {
      console.log(`AniList-MCP server started in SSE mode`);
      console.log(`Listening on http://${activeConfig.host}:${activeConfig.port}`);
      console.log(`Health check: http://${activeConfig.host}:${activeConfig.port}/health`);
      console.log(`SSE endpoint: http://${activeConfig.host}:${activeConfig.port}/sse`);
      console.log(`Authenticated: ${anilist.isAuthenticated()}`);
    });

    const shutdown = () => {
      console.log("Shutting down AniList-MCP server...");
      httpServer.close(() => {
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
    // stdio mode: Diagnostic logs MUST be written to stderr
    console.error("Starting AniList-MCP server in stdio mode...");
    console.error(`Authenticated: ${anilist.isAuthenticated()}`);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("AniList-MCP server connected and ready for requests via stdio.");
  }
}

main().catch((err) => {
  console.error("Fatal error starting AniList-MCP server:", err);
  process.exit(1);
});
