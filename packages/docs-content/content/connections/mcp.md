# MCP

The MCP connection defines a [Model Context Protocol](https://modelcontextprotocol.io/) server that provides tools to [Lowdefy agents](/agents-introduction). MCP is an open standard for connecting AI models to external tools and data sources.

> The MCP connection is provided by the `@lowdefy/connection-mcp` package, which is included by default.

MCP connections are referenced from the `mcp` array on an agent. The agent automatically discovers and uses the tools the MCP server provides. See [MCP Tools](/agent-mcp-tools) for details on using MCP with agents and for inline configuration without a connection.

## Connections

### Mcp

#### Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `transport` | string | `'http'` | Transport protocol: `'http'`, `'sse'`, or `'stdio'`. |
| `url` | string | | URL for the MCP server. Required for `http` and `sse` transports. |
| `headers` | object | | HTTP headers. Only for `http` and `sse`. __Operators are evaluated__. |
| `command` | string | | Command to run. Required for `stdio` transport. |
| `args` | string[] | | Arguments for the stdio command. |
| `env` | object | | Environment variables for the stdio command. __Operators are evaluated__. |

### HTTP Transport

Connect to a remote MCP server over HTTP:

```yaml
connections:
  - id: mcp_tools
    type: Mcp
    properties:
      url: https://mcp.example.com/tools
      transport: http
```

###### With authentication:
```yaml
connections:
  - id: mcp_tools
    type: Mcp
    properties:
      url: https://mcp.example.com/tools
      transport: http
      headers:
        Authorization:
          _string.concat:
            - 'Bearer '
            - _secret: MCP_API_KEY
```

### SSE Transport

Connect using Server-Sent Events:

```yaml
connections:
  - id: mcp_sse
    type: Mcp
    properties:
      url: https://mcp.example.com/sse
      transport: sse
```

### Stdio Transport

Launch a local MCP server process. Useful for npm-published MCP servers:

###### File system access:
```yaml
connections:
  - id: mcp_filesystem
    type: Mcp
    properties:
      transport: stdio
      command: npx
      args:
        - '-y'
        - '@modelcontextprotocol/server-filesystem'
        - '/data/documents'
```

###### GitHub integration:
```yaml
connections:
  - id: mcp_github
    type: Mcp
    properties:
      transport: stdio
      command: npx
      args:
        - '-y'
        - '@modelcontextprotocol/server-github'
      env:
        GITHUB_TOKEN:
          _secret: GITHUB_TOKEN
```

###### Custom server with environment variables:
```yaml
connections:
  - id: mcp_database
    type: Mcp
    properties:
      transport: stdio
      command: node
      args:
        - ./mcp-servers/database.js
      env:
        DATABASE_URL:
          _secret: DATABASE_URL
```

## Usage

Reference MCP connections in the `mcp` array on an agent:

```yaml
agents:
  - id: dev_assistant
    type: ClaudeAgent
    connectionId: anthropic
    properties:
      model: claude-sonnet-4-20250514
      instructions: |
        You help developers with code and GitHub issues.
        Use GitHub tools to search issues, read files,
        and create pull requests.
    mcp:
      - mcp_github
      - mcp_filesystem
```

MCP servers can also be defined inline on the agent without a connection. See [MCP Tools](/agent-mcp-tools) for inline configuration.
