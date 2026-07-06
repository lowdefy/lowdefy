// Named export (not default): @shelf/jest-mongodb loads this file with require()
// and destructures { mongodbMemoryServerOptions } — under Node >=22.12 require(esm)
// resolves, so only a named ESM export is visible to it.
export const mongodbMemoryServerOptions = {
  instance: {
    dbName: 'test',
  },
  autoStart: false,
};
