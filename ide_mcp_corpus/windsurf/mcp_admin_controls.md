Source: https://docs.windsurf.com/plugins/cascade/mcp

## Admin Controls (Teams & Enterprises)
Team admins can toggle MCP access for their team, as well as whitelist approved MCP servers for their team to use:

<Card title="MCP Team Settings" icon="hammer" href="https://windsurf.com/team/settings">
  Configurable MCP settings for your team.
</Card>

<Warning>The above link will only work if you have admin privileges for your team.</Warning>

By default, users within a team will be able to configure their own MCP servers. However, once you whitelist even a single MCP server, **all non-whitelisted servers will be blocked** for your team.

### How Server Matching Works
When you whitelist an MCP server, the system uses **regex pattern matching** with the following rules:

* **Full String Matching**: All patterns are automatically anchored (wrapped with `^(?:pattern)$`) to prevent partial matches
* **Command Field**: Must match exactly or according to your regex pattern
* **Arguments Array**: Each argument is matched individually against its corresponding pattern
* **Array Length**: The number of arguments must match exactly between whitelist and user config
* **Special Characters**: Characters like `$`, `.`, `[`, `]`, `(`, `)` have special regex meaning and should be escaped with `\\` if you want literal matching

### Configuration Options

**Option 1: Plugin Store Default (Recommended)**
Leave the Server Config (JSON) field empty to allow the default configuration from the Windsurf MCP Plugin Store.

**Option 2: Exact Match Configuration**
Provide the exact configuration that users must use. Users must match this configuration exactly.

**Option 3: Flexible Regex Patterns**
Use regex patterns to allow variations in user configurations while maintaining security controls.
