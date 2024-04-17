/*
  Copyright 2020-2024 Lowdefy, Inc

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

import writeJs from './writeJs.js';
import testContext from '../../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeJs', async () => {
  context.jsMap = {
    client: {
      'PGqYgLcEpG/AkAZycfKEpwxXT7Y=': 'return 12;',
      'tjmrJIhufQzEpj/iGu5AumDcrBQ=': 'return 1;',
    },
    server: {
      'h4uNNgee8PnSsXJuEXZQ7FSbnZY=': 'return 10;',
      'tjmrJIhufQzEpj/iGu5AumDcrBQ=': 'return 1;',
    },
  };
  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'plugins/operators/clientJsMap.js',
      `
export default {
  'PGqYgLcEpG/AkAZycfKEpwxXT7Y=': ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) => { return 12; },
  'tjmrJIhufQzEpj/iGu5AumDcrBQ=': ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) => { return 1; },
  };`,
    ],
    [
      'plugins/operators/serverJsMap.js',
      `
export default {
  'h4uNNgee8PnSsXJuEXZQ7FSbnZY=': ({ payload, secrets, user }) => { return 10; },
  'tjmrJIhufQzEpj/iGu5AumDcrBQ=': ({ payload, secrets, user }) => { return 1; },
  };`,
    ],
  ]);
});

test('writeJs empty jsMap', async () => {
  context.jsMap = {
    client: {},
    server: {},
  };

  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'plugins/operators/clientJsMap.js',
      `
export default {
  };`,
    ],
    [
      'plugins/operators/serverJsMap.js',
      `
export default {
  };`,
    ],
  ]);
});
