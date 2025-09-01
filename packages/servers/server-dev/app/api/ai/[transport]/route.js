import { createMcpHandler } from 'mcp-handler';
import fs from 'fs';
import path from 'path';
import listBlocks from './tools/listBlocks.js';
import getBlock from './tools/getBlock.js';

const handler = createMcpHandler(
  async (server) => {
    // Helper function to load blocks schema
    const loadBlocksSchema = () => {
      try {
        const schemasDir = path.join(process.cwd(), 'build/schemas/blocks');
        const files = fs.readdirSync(schemasDir);
        const blocks = {};

        files.forEach((file) => {
          if (file.endsWith('.json')) {
            const blockType = file.replace('.json', '');
            const schemaPath = path.join(schemasDir, file);
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            blocks[blockType] = JSON.parse(schemaContent);
          }
        });

        return blocks;
      } catch (error) {
        console.error('Failed to load blocks schema:', error);
        return {};
      }
    };

    // Helper function to load individual block schema
    const loadBlockSchema = (blockType) => {
      try {
        const schemaPath = path.join(process.cwd(), `build/schemas/blocks/${blockType}.json`);
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        return JSON.parse(schemaContent);
      } catch (error) {
        return null;
      }
    };

    server.tool(...listBlocks(loadBlocksSchema));

    server.tool(...getBlock(loadBlockSchema));
  },
  {
    capabilities: {
      tools: {
        list_blocks: {
          description:
            'Returns a list of all available Lowdefy blocks with their types and packages',
        },
        get_block: {
          description: 'Returns detailed schema information for a specific block type',
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
