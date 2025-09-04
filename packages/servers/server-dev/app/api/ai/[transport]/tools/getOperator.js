import { z } from 'zod';

function getOperator(loadOperatorSchema) {
  return [
    'get_operator',
    'Returns detailed schema information for a specific operator type',
    {
      operatorType: z
        .string()
        .describe('The operator type to get schema for (e.g., "and", "array", "string")'),
    },
    async ({ operatorType }) => {
      const operator = loadOperatorSchema(operatorType);

      if (!operator) {
        return {
          content: [
            {
              type: 'text',
              text: `Operator "${operatorType}" not found.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Operator: ${operatorType}\nPackage: ${
              operator.package
            }\nSchema:\n${JSON.stringify(operator, null, 2)}`,
          },
        ],
      };
    },
  ];
}

export default getOperator;
