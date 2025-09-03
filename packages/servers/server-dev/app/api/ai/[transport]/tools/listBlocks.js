function listBlocks(loadBlocksSummary) {
  return [
    'list_blocks',
    'Returns a list of all available Lowdefy blocks with their types and packages',
    {},
    async () => {
      const blockList = loadBlocksSummary();

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

export default listBlocks;
