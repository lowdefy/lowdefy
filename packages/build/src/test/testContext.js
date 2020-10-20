function testContext({ logger = {}, configLoader, artifactSetter } = {}) {
  const defaultLogger = {
    success: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };

  const context = {
    configLoader: {
      load: () => {},
    },
    artifactSetter: {
      set: () => [],
    },
  };

  context.logger = {
    ...defaultLogger,
    ...logger,
  };

  if (configLoader) {
    context.configLoader = configLoader;
  }
  if (artifactSetter) {
    context.artifactSetter = artifactSetter;
  }

  return context;
}

export default testContext;
