/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Mcp',
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL for the MCP server (used with http and sse transports).',
      errorMessage: {
        type: 'Mcp connection property "url" should be a string.',
      },
    },
    transport: {
      type: 'string',
      enum: ['http', 'sse', 'stdio'],
      default: 'http',
      description: 'Transport protocol for the MCP server.',
      errorMessage: {
        type: 'Mcp connection property "transport" should be a string.',
        enum: 'Mcp connection property "transport" should be one of "http", "sse", or "stdio".',
      },
    },
    headers: {
      type: 'object',
      description: 'HTTP headers to send with requests to the MCP server.',
      errorMessage: {
        type: 'Mcp connection property "headers" should be an object.',
      },
    },
    command: {
      type: 'string',
      description: 'Command to run for stdio transport.',
      errorMessage: {
        type: 'Mcp connection property "command" should be a string.',
      },
    },
    args: {
      type: 'array',
      items: { type: 'string' },
      description: 'Arguments for the stdio command.',
      errorMessage: {
        type: 'Mcp connection property "args" should be an array of strings.',
      },
    },
    env: {
      type: 'object',
      description: 'Environment variables for the stdio command.',
      errorMessage: {
        type: 'Mcp connection property "env" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'Mcp connection properties should be an object.',
  },
};
