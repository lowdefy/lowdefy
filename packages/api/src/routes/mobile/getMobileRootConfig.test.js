/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import getMobileRootConfig from './getMobileRootConfig.js';
import testContext from '../../test/testContext.js';

const routes = [
  { pageId: 'home', path: 'home', auth: { public: true } },
  { pageId: 'today', path: 'today', auth: { public: true } },
  { pageId: 'jobs', path: 'jobs/{job_id}', auth: { public: false } },
  { pageId: 'admin', path: 'admin', auth: { public: false, roles: ['admin'] } },
];

const typeSets = {
  t1: { actions: [], blocks: [{ type: 'Box', package: '@lowdefy/blocks-native', version: 7 }] },
  t2: { actions: [], blocks: [{ type: 'Title', package: '@lowdefy/blocks-native', version: 7 }] },
  t3: { actions: [], blocks: [{ type: 'Button', package: '@lowdefy/blocks-native', version: 7 }] },
};

const pageIndex = [
  { path: 'today', pageId: 'today', hash: 'h-today', typesKey: 't1' },
  { path: 'jobs/{job_id}', pageId: 'jobs', hash: 'h-jobs', typesKey: 't2' },
  { path: 'admin', pageId: 'admin', hash: 'h-admin', typesKey: 't3' },
];

const houseIcon = { node: [['path', { d: 'M3 10' }]] };

const theme = {
  darkMode: 'system',
  light: { colorPrimary: '#1677ff', borderRadius: 6 },
  dark: { colorPrimary: '#1668dc', borderRadius: 6 },
};

const classMap = {
  'p-4': { paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16 },
  'bg-primary': { backgroundColor: '#1677ff' },
  'dark:bg-primary': { backgroundColor: '#1668dc' },
};

const mobileConfig = {
  homePageId: 'today',
  minShellVersion: '7.4.0',
  menus: {
    tabs: [
      { pageId: 'today', title: 'Today', icon: 'House', iconData: houseIcon },
      { pageId: 'jobs', title: 'Jobs' },
      { pageId: 'admin', title: 'Admin' },
    ],
  },
  shells: [{ id: 'field', ios: { bundleId: 'com.example.field', teamId: 'TEAM' } }],
  auth: {
    emailCode: true,
    unlock: 'biometric',
    unlockAfter: 300,
    sharedDevice: false,
    sessionExpiresIn: 2592000,
  },
};

const webEvents = { onInit: { try: [{ id: 'analytics', type: 'PostHogInit' }] } };

const events = { onInit: { try: [{ id: 'set', type: 'SetGlobal', params: { ready: true } }] } };

const appMeta = { slug: 'field-app', buildId: 'build-1' };

function createReadConfigFile(files) {
  return async function readConfigFile(file) {
    return {
      'routes.json': routes,
      'mobile/config.json': mobileConfig,
      'mobile/pageIndex.json': pageIndex,
      'mobile/typeSets.json': typeSets,
      'events.json': webEvents,
      'mobile/events.json': events,
      'global.json': { region: 'eu' },
      'mobile/theme.json': theme,
      'mobile/classMap.json': classMap,
      'mobile/appJs.json': { jsEntries: null },
      'i18n.json': {},
      ...files,
    }[file];
  };
}

test('getMobileRootConfig gives a signed-out caller only the public mobile pages', async () => {
  const context = testContext({ appMeta, readConfigFile: createReadConfigFile() });
  expect(await getMobileRootConfig(context)).toEqual({
    _jsEntries: null,
    auth: null,
    events,
    homePageId: 'today',
    i18n: {},
    lowdefyApp: appMeta,
    lowdefyGlobal: { region: 'eu' },
    minShellVersion: '7.4.0',
    menus: {
      tabs: [{ pageId: 'today', title: 'Today', icon: 'House', iconData: houseIcon }],
    },
    pageIndex: [{ path: 'today', pageId: 'today', hash: 'h-today', typesKey: 't1' }],
    typeSets: { t1: typeSets.t1 },
    theme,
    classMap,
  });
});

test('getMobileRootConfig gives a shell mobile.events, never the web app events', async () => {
  const rootConfig = await getMobileRootConfig(
    testContext({ readConfigFile: createReadConfigFile() })
  );
  expect(rootConfig.events).toEqual(events);
  expect(rootConfig.events).not.toEqual(webEvents);
});

test('getMobileRootConfig gives a shell the mobile auth settings of an app with auth', async () => {
  const context = testContext({ auth: {}, readConfigFile: createReadConfigFile() });
  expect((await getMobileRootConfig(context)).auth).toEqual({
    emailCode: true,
    unlock: 'biometric',
    unlockAfter: 300,
    sharedDevice: false,
  });
});

test('getMobileRootConfig filters the page index, menus and type sets by the caller roles', async () => {
  const context = testContext({
    readConfigFile: createReadConfigFile(),
    user: { sub: 'sub', roles: ['staff'] },
  });
  const rootConfig = await getMobileRootConfig(context);
  expect(rootConfig.pageIndex.map((entry) => entry.pageId)).toEqual(['today', 'jobs']);
  expect(rootConfig.menus.tabs.map((item) => item.pageId)).toEqual(['today', 'jobs']);
  expect(Object.keys(rootConfig.typeSets)).toEqual(['t1', 't2']);
});

test('getMobileRootConfig gives a caller with the role every page', async () => {
  const context = testContext({
    readConfigFile: createReadConfigFile(),
    user: { sub: 'sub', roles: ['admin'] },
  });
  const rootConfig = await getMobileRootConfig(context);
  expect(rootConfig.pageIndex.map((entry) => entry.pageId)).toEqual(['today', 'jobs', 'admin']);
  expect(Object.keys(rootConfig.typeSets)).toEqual(['t1', 't2', 't3']);
});

test('getMobileRootConfig filters drawer items and keeps a stack frame', async () => {
  const drawer = await getMobileRootConfig(
    testContext({
      readConfigFile: createReadConfigFile({
        'mobile/config.json': {
          ...mobileConfig,
          menus: { drawer: [{ pageId: 'today' }, { pageId: 'admin' }] },
        },
      }),
    })
  );
  expect(drawer.menus).toEqual({ drawer: [{ pageId: 'today' }] });
  const stack = await getMobileRootConfig(
    testContext({
      readConfigFile: createReadConfigFile({
        'mobile/config.json': { ...mobileConfig, menus: { stack: true } },
      }),
    })
  );
  expect(stack.menus).toEqual({ stack: true });
});

test('getMobileRootConfig lists dev page index entries without hashes or type sets', async () => {
  const context = testContext({
    readConfigFile: createReadConfigFile({
      'mobile/pageIndex.json': [
        { path: 'today', pageId: 'today' },
        { path: 'jobs/{job_id}', pageId: 'jobs' },
      ],
      'mobile/typeSets.json': {},
    }),
  });
  const rootConfig = await getMobileRootConfig(context);
  expect(rootConfig.pageIndex).toEqual([{ path: 'today', pageId: 'today' }]);
  expect(rootConfig.typeSets).toEqual({});
});

test('getMobileRootConfig sends the whole theme and class map to every caller', async () => {
  const signedOut = await getMobileRootConfig(
    testContext({ readConfigFile: createReadConfigFile() })
  );
  const admin = await getMobileRootConfig(
    testContext({ readConfigFile: createReadConfigFile(), user: { sub: 'sub', roles: ['admin'] } })
  );
  expect(signedOut.theme).toEqual(theme);
  expect(signedOut.classMap).toEqual(classMap);
  expect(admin.theme).toEqual(theme);
  expect(admin.classMap).toEqual(classMap);
});

test('getMobileRootConfig returns null for an app without a mobile key', async () => {
  const context = testContext({
    readConfigFile: createReadConfigFile({
      'mobile/config.json': {},
      'mobile/pageIndex.json': [],
      'mobile/typeSets.json': {},
      'mobile/theme.json': {},
      'mobile/classMap.json': {},
    }),
  });
  expect(await getMobileRootConfig(context)).toBeNull();
});

test('getMobileRootConfig gives a shell the app i18n and the mobile.events _js as module text', async () => {
  const i18n = {
    defaultLocale: 'en-US',
    locales: [
      { code: 'en-US', dayjs: 'en' },
      { code: 'af-ZA', dayjs: 'af' },
    ],
    messages: { 'af-ZA': { hello: 'Hallo' } },
  };
  const jsEntries = "export default { 'h1': ({ state }) => { return state.a; }, };";
  const rootConfig = await getMobileRootConfig(
    testContext({
      readConfigFile: createReadConfigFile({
        'i18n.json': i18n,
        'mobile/appJs.json': { jsEntries },
      }),
    })
  );
  expect(rootConfig.i18n).toEqual(i18n);
  expect(rootConfig._jsEntries).toBe(jsEntries);
});
