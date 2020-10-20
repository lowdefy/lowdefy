function testContext({ artifactSetter, configLoader, logger = {}, metaLoader } = {}) {
  const defaultLogger = {
    success: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };

  const context = {
    artifactSetter: {
      set: () => [],
    },
    configLoader: {
      load: () => {},
    },
    metaLoader: {
      load: () => {},
    },
  };

  context.logger = {
    ...defaultLogger,
    ...logger,
  };

  if (artifactSetter) {
    context.artifactSetter = artifactSetter;
  }
  if (configLoader) {
    context.configLoader = configLoader;
  }
  if (metaLoader) {
    context.metaLoader = metaLoader;
  }

  return context;
}

export default testContext;
