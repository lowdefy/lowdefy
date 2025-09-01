import { z } from 'zod';

export default function getBlock(loadBlockSchema) {
  return [
    'get_block',
    'Returns detailed schema information for a specific block type',
    {
      blockType: z
        .string()
        .describe('The block type to get schema for (e.g., "Box", "Button", "TextInput")'),
    },
    async ({ blockType }) => {
      const block = loadBlockSchema(blockType);

      if (!block) {
        return {
          content: [
            {
              type: 'text',
              text: `Block type "${blockType}" not found.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Block: ${blockType}\nPackage: ${block.package}\nSchema:\n${JSON.stringify(
              block.schema,
              null,
              2
            )}`,
          },
        ],
      };
    },
  ];
}
