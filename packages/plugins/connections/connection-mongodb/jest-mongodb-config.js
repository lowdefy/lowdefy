// @shelf/jest-mongodb loads this with require() and destructures
// mongodbMemoryServerOptions - on Node >= 22 require(esm) returns the module
// namespace, so the option object must be a named export to be found.
export const mongodbMemoryServerOptions = {
  instance: {
    dbName: 'test',
  },
  autoStart: false,
};

export default { mongodbMemoryServerOptions };
