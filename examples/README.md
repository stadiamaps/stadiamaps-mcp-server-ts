# Stadia Maps MCP Server Examples

This directory contains examples of how to use the Stadia Maps MCP server.

## Anthropic SDK Demo

[`anthropic-sdk-demo.ts`](anthropic-sdk-demo.ts) demonstrates how to use the MCP server with the Anthropic SDK.
This lets you create applications combining Claude's generalist abilities
with the spatial intelligence of the Stadia Maps API.

The example code demonstrates the basics of an integration,
including selecting a subset of tools to use,
initializing a local MCP server,
and handling tools in an interaction which can span multiple turns back and forth.

Refer to the [Anthropic documentation](https://docs.anthropic.com/en/api/client-sdks) for current best practices.

### Environment Variables

You must these environment variables before running the demo:

- `STADIA_MAPS_API_KEY`: Your [Stadia Maps API key](https://docs.stadiamaps.com/authentication/)
- `ANTHROPIC_API_KEY`: Your [Anthropic API key](https://docs.anthropic.com/en/api/overview)

Set these in your IDE run window (e.g. WebStorm)
or via the command line (i.e. `export STADIA_MAPS_API_KEY=YOUR-API-KEY` in most shells).

You can get a Stadia Maps API key for free to try out the APIs used in this example.
Just click the link above for more info.
You will also need an Anthropic API key, and you can find more info on their website.
As of June 2025, **running this demo will cost approximately $0.15 worth of Anthropic API credits**.

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
