# Stadia Maps MCP Server (TypeScript)

## Quickstart

### Configuration

This application requires a Stadia Maps API key.
Set the `API_KEY` environment variable with your API key.

For example, if you're using Claude Desktop,
your config would look something like this:

```json
{
  "mcpServers": {
    "stadiamaps": {
      "command": "/path/to/node",
      "args": ["/path/to/stadiamaps-mcp-server-ts/build/index.js"],
      "env": {
        "API_KEY": "YOUR-API-KEY"
      }
    }
  }
}
```

### Building

We use [bun](https://bun.sh/) because it's simple and fast.
We'll use `bun` for all of our instructions,
but you can use `npm` too.

Run `bun install` to fetch the dependencies.
Then, execute the build script: `bun run build`.
