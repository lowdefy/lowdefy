import { z } from 'zod';

function getConnection(loadConnectionSchema) {
  return [
    'get_connection',
    'Returns detailed schema information for a specific connection type',
    {
      connectionType: z
        .string()
        .describe(
          'The connection type to get schema for (e.g., "MongoDBCollection", "AxiosHttp", "ElasticsearchSearch")'
        ),
    },
    async ({ connectionType }) => {
      const connection = loadConnectionSchema(connectionType);

      if (!connection) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection type "${connectionType}" not found.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Connection: ${connectionType}\nPackage: ${
              connection.package
            }\nSchema:\n${JSON.stringify(connection.schema, null, 2)}`,
          },
        ],
      };
    },
  ];
}

export default getConnection;
