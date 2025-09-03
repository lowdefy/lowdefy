function listConnections(loadConnectionsSummary) {
  return [
    'list_connections',
    'Returns a list of all available Lowdefy connections with their types and packages',
    {},
    async () => {
      const connectionList = loadConnectionsSummary();

      return {
        content: [
          {
            type: 'text',
            text: `Available connections:\n${JSON.stringify(connectionList, null, 2)}`,
          },
        ],
      };
    },
  ];
}

export default listConnections;
