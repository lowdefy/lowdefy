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

import writeMobileConfig from './writeMobileConfig.js';
import testContext from '../../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();
const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeMobileConfig writes defaults when no mobile config is defined', async () => {
  await writeMobileConfig({ components: {}, context });
  expect(mockWriteBuildArtifact.mock.calls[0][0]).toEqual('mobile/config.json');
  expect(JSON.parse(mockWriteBuildArtifact.mock.calls[0][1])).toEqual({
    appId: null,
    capacitor: {},
    homePageId: null,
    name: null,
    serverUrl: null,
  });
});

test('writeMobileConfig writes mobile config fields', async () => {
  const components = {
    name: 'App Name',
    mobile: {
      appId: 'com.acme.tracker',
      name: 'Acme Tracker',
      serverUrl: 'https://app.acme.com',
      config: { homePageId: 'm-home' },
      capacitor: { ios: { scheme: 'AcmeTracker' } },
    },
  };
  await writeMobileConfig({ components, context });
  expect(JSON.parse(mockWriteBuildArtifact.mock.calls[0][1])).toEqual({
    appId: 'com.acme.tracker',
    capacitor: { ios: { scheme: 'AcmeTracker' } },
    homePageId: 'm-home',
    name: 'Acme Tracker',
    serverUrl: 'https://app.acme.com',
  });
});

test('writeMobileConfig falls back to app name when mobile name is not set', async () => {
  const components = { name: 'App Name', mobile: {} };
  await writeMobileConfig({ components, context });
  expect(JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]).name).toEqual('App Name');
});
