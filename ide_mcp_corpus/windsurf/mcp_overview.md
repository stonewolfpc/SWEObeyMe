Source: https://docs.windsurf.com/windsurf/cascade/mcp
Last updated: 2026-04-27 (Wave 14+, Windsurf 2.0 era)

Configure MCP servers to extend Cascade with custom tools and services using stdio, Streamable HTTP, or SSE transports with admin controls for Teams and Enterprise.

**MCP (Model Context Protocol)** is a protocol that enables LLMs to access custom tools and services.
An MCP client (Cascade, in this case) can make requests to MCP servers to access tools that they provide.
Cascade now natively integrates with MCP, allowing you to bring your own selection of MCP servers for Cascade to use.
See the [official MCP docs](https://modelcontextprotocol.io/) for more information.

**Supported transport types**: `stdio`, `Streamable HTTP`, `SSE`
**OAuth support**: Cascade supports OAuth for each transport type.
**One-click install**: MCP servers can be installed via deeplink (one-click install) in addition to manual config.

<Note>Enterprise users must manually turn this on via settings</Note>

## Key facts for extension authors
- Config file: `~/.codeium/mcp_config.json`
- MCP client is Cascade — your server speaks standard MCP protocol
- Cascade automatically detects when MCP tools are relevant
- Tool chaining: Cascade can combine multiple MCP tools in a single workflow
- Press the refresh button after adding a new MCP plugin
