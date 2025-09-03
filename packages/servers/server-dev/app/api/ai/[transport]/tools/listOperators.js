function listOperators(loadOperatorsSummary) {
  return [
    'list_operators',
    'Returns a list of all available Lowdefy operators with their types and packages',
    {},
    async () => {
      const operatorList = loadOperatorsSummary();

      return {
        content: [
          {
            type: 'text',
            text: `Available operators:\n${JSON.stringify(operatorList, null, 2)}`,
          },
        ],
      };
    },
  ];
}

export default listOperators;
