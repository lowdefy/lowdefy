import { z } from 'zod';

function getAction(loadActionSchema) {
  return [
    'get_action',
    'Returns detailed schema information for a specific action type',
    {
      actionType: z
        .string()
        .describe('The action type to get schema for (e.g., "CallAPI", "SetState", "Fetch")'),
    },
    async ({ actionType }) => {
      const action = loadActionSchema(actionType);

      if (!action) {
        return {
          content: [
            {
              type: 'text',
              text: `Action "${actionType}" not found.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Action: ${actionType}\nPackage: ${action.package}\nSchema:\n${JSON.stringify(
              action,
              null,
              2
            )}`,
          },
        ],
      };
    },
  ];
}

export default getAction;
