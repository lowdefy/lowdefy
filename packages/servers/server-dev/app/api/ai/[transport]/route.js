import { createMcpHandler } from 'mcp-handler';
import getAction from './tools/getAction.js';
import getBlock from './tools/getBlock.js';
import getConnection from './tools/getConnection.js';
import getOperator from './tools/getOperator.js';
import listActions from './tools/listActions.js';
import listBlocks from './tools/listBlocks.js';
import listConnections from './tools/listConnections.js';
import listOperators from './tools/listOperators.js';
import loadIndividualSchema from './helpers/loadIndividualSchema.js';
import loadSchemasAsArray from './helpers/loadSchemasAsArray.js';

const handler = createMcpHandler(
  async (server) => {
    // Actions
    server.tool(...listActions(() => loadSchemasAsArray('actions', ['schema'])));
    server.tool(...getAction((actionType) => loadIndividualSchema('actions', actionType)));

    // Blocks
    server.tool(...listBlocks(() => loadSchemasAsArray('blocks', ['schema'])));
    server.tool(...getBlock((blockType) => loadIndividualSchema('blocks', blockType)));

    // Connections
    server.tool(...listConnections(() => loadSchemasAsArray('connections', ['schema'])));
    server.tool(
      ...getConnection((connectionType) => loadIndividualSchema('connections', connectionType))
    );

    // Operators
    server.tool(...listOperators(() => loadSchemasAsArray('operators', ['schema'])));
    server.tool(
      ...getOperator((operatorType, context) =>
        loadIndividualSchema('operators', `${operatorType}_${context}`)
      )
    );
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
          description:
            'Returns detailed schema information for a specific operator type and context',
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
