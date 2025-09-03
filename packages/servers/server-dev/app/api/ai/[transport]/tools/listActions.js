function listActions(loadActionsSummary) {
  return [
    'list_actions',
    'Returns a list of all available Lowdefy actions with their types and packages',
    {},
    async () => {
      const actionList = loadActionsSummary();

      return {
        content: [
          {
            type: 'text',
            text: `Available actions:\n${JSON.stringify(actionList, null, 2)}`,
          },
        ],
      };
    },
  ];
}

export default listActions;
