# Claude Desktop Setup

The [Anthropic documentation](https://modelcontextprotocol.io/quickstart/user) is always the definitive source,
but here's a quick guide to setting up the MCP server in the Claude Desktop:

1. Open the settings window in Claude Desktop.
2. Click on the "Developer" settings tab.
3. Click "Edit Config."
4. Add the MCP server in the `mcpServers` configuration section.
5. Save and restart Claude Desktop.

Here's an example configuration.
You'll need to know the path to the nodejs program,
and the (full!) path to `index.js` in the `build` folder.

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
