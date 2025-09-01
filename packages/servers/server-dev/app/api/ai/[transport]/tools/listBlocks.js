export default function listBlocks(loadBlocksSchema) {
  return [
    'list_blocks',
    'Returns a list of all available Lowdefy blocks with their types and packages',
    {},
    async () => {
      const blocks = loadBlocksSchema();
      const blockList = Object.keys(blocks).map((blockType) => ({
        type: blockType,
        package: blocks[blockType].package,
        description:
          blocks[blockType].schema?.properties?.type?.description || `${blockType} block`,
      }));

      return {
        content: [
          {
            type: 'text',
            text: `Available blocks:\n${JSON.stringify(blockList, null, 2)}`,
          },
        ],
      };
    },
  ];
}
