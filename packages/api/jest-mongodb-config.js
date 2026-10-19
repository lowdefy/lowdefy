// Named export (not default): @shelf/jest-mongodb loads this file with require()
// and destructures { mongodbMemoryServerOptions } — under Node >=22.12 require(esm)
// resolves, so only a named ESM export is visible to it. Same server shape as
// @lowdefy/connection-mongodb's suite, so both share the downloaded binary.
export const mongodbMemoryServerOptions = {
  instance: {
    dbName: 'test',
  },
  replSet: {
    count: 1,
    dbName: 'test',
    storageEngine: 'wiredTiger',
  },
  autoStart: false,
};

export default { mongodbMemoryServerOptions };
