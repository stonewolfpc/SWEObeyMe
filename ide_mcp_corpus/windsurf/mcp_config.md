Source: https://docs.windsurf.com/plugins/cascade/mcp

## Adding a new MCP plugin
New MCP plugins can be added by going to the `Settings` > `Tools` > `Windsurf Settings` > `Add Server` section.

If you cannot find your desired MCP plugin, you can add it manually by clicking `View Raw Config` button and editing the raw `mcp_config.json` file.

When you click on an MCP server, simply click `+ Add Server` to expose the server and its tools to Cascade.

Cascade supports three [transport types](https://modelcontextprotocol.io/docs/concepts/transports) for MCP
servers: `stdio`,  `Streamable HTTP`, and `SSE`.

Cascade also supports OAuth for each transport type.

For `http` servers, the URL should reflect that of the endpoint and resemble `https://<your-server-url>/mcp`.

<Note>Make sure to press the refresh button after you add a new MCP plugin.</Note>

## mcp_config.json
The `~/.codeium/mcp_config.json` file is a JSON file that contains a list of servers that Cascade can connect to.

Here's an example configuration, which sets up a single server for GitHub:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_PERSONAL_ACCESS_TOKEN>"
      }
    }
  }
}
```

Be sure to provide the required arguments and environment variables for the servers that you want to use.

See the [official MCP server reference repository](https://github.com/modelcontextprotocol/servers) or [OpenTools](https://opentools.com/) for some example servers.
