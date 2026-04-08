Source: https://docs.windsurf.com/plugins/cascade/mcp

### Remote HTTP MCPs
It's important to note that for remote HTTP MCPs, the configuration is slightly
different and requires a `serverUrl` or `url` field.

Here's an example configuration for an HTTP server:

```json
{
  "mcpServers": {
    "remote-http-mcp": {
      "serverUrl": "<your-server-url>/mcp",
      "headers": {
        "API_KEY": "value"
      }
    }
  }
}
```

### Config Interpolation
The `~/.codeium/mcp_config.json` file handles interpolation of
environment variables in these fields: `command`, `args`, `env`, `serverUrl`, `url`, and
`headers`.

Here's an example configuration, which uses an `AUTH_TOKEN` environment variable
in `headers`.

```json
{
  "mcpServers": {
    "remote-http-mcp": {
      "serverUrl": "<your-server-url>/mcp",
      "headers": {
        "API_KEY": "Bearer ${env:AUTH_TOKEN}"
      }
    }
  }
}
```
