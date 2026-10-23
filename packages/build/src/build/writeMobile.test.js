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

import { vi, beforeEach, expect, test } from 'vitest';

import { icons as lucideIcons } from 'lucide';

import createIconSemanticMap from './icons/createIconSemanticMap.js';
import createLucideIconLayer from './icons/createLucideIconLayer.js';
import writeMobile from './writeMobile.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = vi.fn();

function createContext() {
  const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });
  context.mobilePageIndex = [{ path: 'today', pageId: 'today', hash: 'h1', typesKey: 't1' }];
  context.mobileTypeSets = { t1: { actions: [], blocks: [], operators: [] } };
  context.mobileTheme = {
    darkMode: 'system',
    light: { colorPrimary: '#1677ff' },
    dark: { colorPrimary: '#1668dc' },
  };
  context.mobileClassMap = { 'p-4': { padding: 16 } };
  context.mobileAppJsEntries = 'export default {};';
  return context;
}

function getArtifacts() {
  return Object.fromEntries(
    mockWriteBuildArtifact.mock.calls.map(([filePath, content]) => [filePath, JSON.parse(content)])
  );
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeMobile writes empty artifacts for an app without a mobile key', async () => {
  const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });
  context.mobilePageIndex = [];
  context.mobileTypeSets = {};
  context.mobileTheme = {};
  context.mobileClassMap = {};
  context.mobileAppJsEntries = null;
  await writeMobile({ components: {}, context });
  expect(getArtifacts()).toEqual({
    'mobile/config.json': {},
    'mobile/events.json': {},
    'mobile/pageIndex.json': [],
    'mobile/typeSets.json': {},
    'mobile/theme.json': {},
    'mobile/classMap.json': {},
    'mobile/appJs.json': { jsEntries: null },
  });
});

test('writeMobile defaults to a stack frame and the first mobile page as home', async () => {
  const context = createContext();
  await writeMobile({ components: { mobile: { events: {} } }, context });
  expect(getArtifacts()).toEqual({
    'mobile/config.json': {
      homePageId: 'today',
      minShellVersion: null,
      menus: { stack: true },
      shells: [],
      auth: {
        emailCode: true,
        unlock: 'none',
        unlockAfter: 300,
        sharedDevice: false,
        sessionExpiresIn: null,
      },
    },
    'mobile/events.json': {},
    'mobile/pageIndex.json': [{ path: 'today', pageId: 'today', hash: 'h1', typesKey: 't1' }],
    'mobile/typeSets.json': { t1: { actions: [], blocks: [], operators: [] } },
    'mobile/theme.json': {
      darkMode: 'system',
      light: { colorPrimary: '#1677ff' },
      dark: { colorPrimary: '#1668dc' },
    },
    'mobile/classMap.json': { 'p-4': { padding: 16 } },
    'mobile/appJs.json': { jsEntries: 'export default {};' },
  });
});

test('writeMobile writes mobile.events for the mobile root', async () => {
  const context = createContext();
  const events = {
    onInit: { try: [{ id: 'ready', type: 'SetGlobal', params: { ready: true } }], catch: [] },
  };
  await writeMobile({ components: { mobile: { events } }, context });
  expect(getArtifacts()['mobile/events.json']).toEqual(events);
});

test('writeMobile writes empty events for a mobile root without events', async () => {
  const context = createContext();
  await writeMobile({ components: { mobile: { homePageId: 'today' } }, context });
  expect(getArtifacts()['mobile/events.json']).toEqual({});
});

test('writeMobile takes the home page from the first menu item', async () => {
  const context = createContext();
  await writeMobile({
    components: {
      mobile: {
        events: {},
        minShellVersion: '7.4.0',
        menus: { drawer: [{ pageId: 'jobs', title: 'Jobs', '~k': 'k1' }] },
      },
    },
    context,
  });
  expect(getArtifacts()['mobile/config.json']).toEqual({
    homePageId: 'jobs',
    minShellVersion: '7.4.0',
    menus: { drawer: [{ pageId: 'jobs', title: 'Jobs' }] },
    shells: [],
    auth: {
      emailCode: true,
      unlock: 'none',
      unlockAfter: 300,
      sharedDevice: false,
      sessionExpiresIn: null,
    },
  });
});

test('writeMobile writes shells with sha256 as a list', async () => {
  const context = createContext();
  await writeMobile({
    components: {
      mobile: {
        events: {},
        homePageId: 'today',
        shells: [
          {
            id: 'field',
            scheme: 'field',
            android: { package: 'com.example.field', sha256: 'AA:BB', '~k': 'k2' },
            '~k': 'k1',
          },
          { id: 'ops', ios: { bundleId: 'com.example.ops', teamId: 'T1' } },
        ],
      },
    },
    context,
  });
  expect(getArtifacts()['mobile/config.json'].shells).toEqual([
    {
      id: 'field',
      scheme: 'field',
      distribution: 'private',
      android: { package: 'com.example.field', sha256: ['AA:BB'] },
    },
    {
      id: 'ops',
      distribution: 'private',
      ios: { bundleId: 'com.example.ops', teamId: 'T1' },
    },
  ]);
});

test('writeMobile writes the store fields of a shell with the icon as an absolute path', async () => {
  const context = createContext();
  context.directories.config = '/apps/field-app';
  await writeMobile({
    components: {
      mobile: {
        events: {},
        homePageId: 'today',
        shells: [
          {
            id: 'field',
            name: 'Field',
            icon: 'mobile/icon.png',
            color: '#0B5FFF',
            profile: 'field',
            version: '1.4',
            scheme: 'field',
            distribution: 'store',
            eas: { owner: 'example', projectId: 'p1', '~k': 'k3' },
            ios: { bundleId: 'com.example.field', teamId: 'T1' },
            android: { package: 'com.example.field', sha256: ['AA:BB'] },
            '~k': 'k1',
          },
        ],
      },
    },
    context,
  });
  expect(getArtifacts()['mobile/config.json'].shells).toEqual([
    {
      id: 'field',
      name: 'Field',
      icon: '/apps/field-app/mobile/icon.png',
      color: '#0B5FFF',
      profile: 'field',
      version: '1.4',
      scheme: 'field',
      distribution: 'store',
      eas: { owner: 'example', projectId: 'p1' },
      ios: { bundleId: 'com.example.field', teamId: 'T1' },
      android: { package: 'com.example.field', sha256: ['AA:BB'] },
    },
  ]);
});

test('writeMobile writes the shell plugins lowdefy mobile config installs', async () => {
  const context = createContext();
  await writeMobile({
    components: {
      mobile: {
        homePageId: 'today',
        shells: [
          {
            id: 'field',
            plugins: [
              {
                name: '@example/lowdefy-printer',
                version: '2.1.0',
                typePrefix: 'Printer',
                '~k': 'k2',
              },
              { name: '@example/lowdefy-mdm', version: '1.0.3', options: { tenant: 'field-team' } },
            ],
          },
          { id: 'office' },
        ],
      },
    },
    context,
  });
  expect(getArtifacts()['mobile/config.json'].shells).toEqual([
    {
      id: 'field',
      distribution: 'private',
      plugins: [
        { name: '@example/lowdefy-printer', version: '2.1.0', typePrefix: 'Printer' },
        { name: '@example/lowdefy-mdm', version: '1.0.3', options: { tenant: 'field-team' } },
      ],
    },
    { id: 'office', distribution: 'private' },
  ]);
});

test('writeMobile writes mobile.auth as configured', async () => {
  const context = createContext();
  await writeMobile({
    components: {
      mobile: {
        events: {},
        auth: {
          emailCode: false,
          unlock: 'biometric',
          unlockAfter: 60,
          sharedDevice: true,
          sessionExpiresIn: 2592000,
        },
      },
    },
    context,
  });
  expect(getArtifacts()['mobile/config.json'].auth).toEqual({
    emailCode: false,
    unlock: 'biometric',
    unlockAfter: 60,
    sharedDevice: true,
    sessionExpiresIn: 2592000,
  });
});

test('writeMobile writes tab icons with their data, sfSymbol and role, the search tab with the search icon', async () => {
  const context = createContext();
  const sets = { lucide: [createLucideIconLayer()] };
  context.icons = {
    sets,
    defaultSet: 'lucide',
    semantic: createIconSemanticMap({ sets, defaultSet: 'lucide' }),
  };
  await writeMobile({
    components: {
      mobile: {
        events: {},
        menus: {
          tabs: [
            { pageId: 'today', title: 'Today', icon: 'Inbox' },
            { pageId: 'jobs', title: 'Jobs', icon: 'edit', sfSymbol: 'square.and.pencil' },
            { pageId: 'find', title: 'Search', role: 'search' },
          ],
        },
      },
    },
    context,
  });
  expect(getArtifacts()['mobile/config.json'].menus.tabs).toEqual([
    { pageId: 'today', title: 'Today', icon: 'Inbox', iconData: { node: lucideIcons.Inbox } },
    {
      pageId: 'jobs',
      title: 'Jobs',
      icon: 'edit',
      iconData: { node: lucideIcons.Pencil },
      sfSymbol: 'square.and.pencil',
    },
    {
      pageId: 'find',
      title: 'Search',
      icon: 'search',
      iconData: { node: lucideIcons.Search },
      role: 'search',
    },
  ]);
});
