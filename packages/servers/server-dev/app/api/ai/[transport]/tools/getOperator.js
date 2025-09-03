import { z } from 'zod';

function getOperator(loadOperatorSchema) {
  return [
    'get_operator',
    'Returns detailed schema information for a specific operator type and context',
    {
      operatorType: z
        .string()
        .describe('The operator type to get schema for (e.g., "and", "array", "string")'),
      context: z
        .string()
        .describe('The operator context (e.g., "shared", "client", "server", "build")'),
    },
    async ({ operatorType, context }) => {
      const operator = loadOperatorSchema(operatorType, context);

      if (!operator) {
        return {
          content: [
            {
              type: 'text',
              text: `Operator "${operatorType}" with context "${context}" not found.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Operator: ${operatorType} (${context})\nPackage: ${
              operator.package
            }\nSchema:\n${JSON.stringify(operator, null, 2)}`,
          },
        ],
      };
    },
  ];
}

export default getOperator;
