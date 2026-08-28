// Named export (not default): @shelf/jest-mongodb loads this file with require()
// and destructures { mongodbMemoryServerOptions } — under Node >=22.12 require(esm)
// resolves, so only a named ESM export is visible to it.
// A single-node replica set is used instead of a standalone server because the
// consecutive id requests use transactions, which require a replica set. The
// instance block is still required — the preset reads instance.dbName even in
// replica set mode.
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
