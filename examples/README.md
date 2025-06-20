# Stadia Maps MCP Server Examples

This directory contains examples of how to use the Stadia Maps MCP server.

## Anthropic SDK Demo

[`anthropic-sdk-demo.ts`](anthropic-sdk-demo.ts) demonstrates how to use the MCP server with the Anthropic SDK.
This lets you create applications combining Claude's generalist abilities
with the spatial intelligence of the Stadia Maps API.

### Environment Variables

You must these environment variables before running the demo:

- `STADIA_MAPS_API_KEY`: Your [Stadia Maps API key](https://docs.stadiamaps.com/authentication/)
- `ANTHROPIC_API_KEY`: Your [Anthropic API key](https://docs.anthropic.com/en/api/overview)

Set these in your IDE run window (e.g. WebStorm)
or via the command line (i.e. `export STADIA_MAPS_API_KEY=YOUR-API-KEY` in most shells).

### Running the demo

We'll use [bun](https://bun.sh/) as it's fast and able to execute TypeScript scripts directly.

1. First, build the main MCP server:
   ```shell
   cd .. && bun run build
   ```

2. Then the demo:
   ```shell
   bun run start:anthropic-demo
   ```
