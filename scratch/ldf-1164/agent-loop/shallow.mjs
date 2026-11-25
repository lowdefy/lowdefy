// LDF-1164 scratch: run the dev server's config build (shallowBuild) as the manager does.
const L = '/Users/puffin/.puffin/work/31792/lowdefy';
const APP = '/Users/puffin/.puffin/work/31792/pelican/apps/pelican';
const DEV = `${APP}/.lowdefy/dev`;
const { shallowBuild } = await import(`${L}/packages/build/dist/indexDev.js`);
const { default: createCustomPluginTypesMap } = await import(`${DEV}/manager/utils/createCustomPluginTypesMap.mjs`);
const { default: createCustomPluginMessagesMap } = await import(`${DEV}/manager/utils/createCustomPluginMessagesMap.mjs`);
const { createNodeLogger } = await import(`${L}/packages/utils/logger/dist/node/index.js`);
const logger = createNodeLogger({ name: 'shallow', level: 'error' });
const directories = { config: APP, server: DEV, build: '/tmp/ldf1164b/shallow-build', buildStaging: '/tmp/ldf1164b/shallow-build' };
for (let i = 0; i < Number(process.argv[2] ?? 1); i++) {
  const t = performance.now();
  const [{ customTypesMap, customTypesMapMobile }, customMessagesMap] = await Promise.all([
    createCustomPluginTypesMap({ cache: true, directories, logger }),
    createCustomPluginMessagesMap({ cache: true, directories, logger }),
  ]);
  const t1 = performance.now();
  await shallowBuild({ customMessagesMap, customTypesMap, customTypesMapMobile, directories, logger, stage: 'dev' });
  console.log(JSON.stringify({ run: i, maps: Math.round(t1 - t), shallowBuild: Math.round(performance.now() - t1) }));
}
