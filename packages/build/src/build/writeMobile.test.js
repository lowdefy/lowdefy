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

import { jest } from '@jest/globals';

import writeMobile from './writeMobile.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

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
  await writeMobile({ components: {}, context });
  expect(getArtifacts()).toEqual({
    'mobile/config.json': {},
    'mobile/pageIndex.json': [],
    'mobile/typeSets.json': {},
    'mobile/theme.json': {},
    'mobile/classMap.json': {},
  });
});

test('writeMobile defaults to a stack frame and the first mobile page as home', async () => {
  const context = createContext();
  await writeMobile({ components: { mobile: {} }, context });
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
    'mobile/pageIndex.json': [{ path: 'today', pageId: 'today', hash: 'h1', typesKey: 't1' }],
    'mobile/typeSets.json': { t1: { actions: [], blocks: [], operators: [] } },
    'mobile/theme.json': {
      darkMode: 'system',
      light: { colorPrimary: '#1677ff' },
      dark: { colorPrimary: '#1668dc' },
    },
    'mobile/classMap.json': { 'p-4': { padding: 16 } },
  });
});

test('writeMobile takes the home page from the first menu item', async () => {
  const context = createContext();
  await writeMobile({
    components: {
      mobile: {
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
      android: { package: 'com.example.field', sha256: ['AA:BB'] },
    },
    { id: 'ops', ios: { bundleId: 'com.example.ops', teamId: 'T1' } },
  ]);
});

test('writeMobile writes mobile.auth as configured', async () => {
  const context = createContext();
  await writeMobile({
    components: {
      mobile: {
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
