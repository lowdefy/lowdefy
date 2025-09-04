/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { createMcpHandler } from 'mcp-handler';
import getAction from './tools/getAction.js';
import getBlock from './tools/getBlock.js';
import getConnection from './tools/getConnection.js';
import getOperator from './tools/getOperator.js';
import listActions from './tools/listActions.js';
import listBlocks from './tools/listBlocks.js';
import listConnections from './tools/listConnections.js';
import listOperators from './tools/listOperators.js';

const handler = createMcpHandler(
  async (server) => {
    // Actions
    server.tool(...listActions);
    server.tool(...getAction);

    // Blocks
    server.tool(...listBlocks);
    server.tool(...getBlock);

    // Connections
    server.tool(...listConnections);
    server.tool(...getConnection);

    // Operators
    server.tool(...listOperators);
    server.tool(...getOperator);
  },
  {
    capabilities: {
      tools: {
        list_actions: {
          description: 'Returns a list all available Lowdefy actions with their types and packages',
        },
        get_action: {
          description: 'Returns detailed schema information for a specific action type',
        },
        list_blocks: {
          description:
            'Returns a list of all available Lowdefy blocks with their types and packages',
        },
        get_block: {
          description: 'Returns detailed schema information for a specific block type',
        },
        list_connections: {
          description:
            'Returns a list of all available Lowdefy connections with their types and packages',
        },
        get_connection: {
          description: 'Returns detailed schema information for a specific connection type',
        },
        list_operators: {
          description:
            'Returns a list of all available Lowdefy operators with their types and packages',
        },
        get_operator: {
          description: 'Returns detailed schema information for a specific operator type',
        },
      },
    },
  },
  {
    basePath: '/api/ai',
    verboseLogs: true,
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
