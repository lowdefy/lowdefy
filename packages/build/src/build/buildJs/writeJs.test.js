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
      A: 'return 12;',
      B: 'return 1;',
    },
    server: {
      C: 'return 10;',
      D: 'return 1;',
    },
  };
  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'plugins/operators/clientJsMap.js',
      `
export default {
  'A': ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) => { return 12; },
  'B': ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) => { return 1; },
  };`,
    ],
    [
      'plugins/operators/serverJsMap.js',
      `
export default {
  'C': ({ payload, secrets, user }) => { return 10; },
  'D': ({ payload, secrets, user }) => { return 1; },
  };`,
    ],
  ]);
});

test('writeJs multiline', async () => {
  context.jsMap = {
    client: {
      A: `const parts = input.split('-').filter(part => part);
      return parts.reduce((acc, current, index) => {
        const prefix = index === 0 ? '-' : acc[index - 1] + '-';
        acc.push(prefix + current);
        return acc;
      }, []);`,
    },
    server: {
      C: `let array = [1, 2, 3, 4, 5, 6];
      if (array.length > 3) {
        array.splice(3);
      }
      console.log(array);`,
    },
  };
  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'plugins/operators/clientJsMap.js',
      `
export default {
  'A': ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) => { const parts = input.split('-').filter(part => part);
      return parts.reduce((acc, current, index) => {
        const prefix = index === 0 ? '-' : acc[index - 1] + '-';
        acc.push(prefix + current);
        return acc;
      }, []); },
  };`,
    ],
    [
      'plugins/operators/serverJsMap.js',
      `
export default {
  'C': ({ payload, secrets, user }) => { let array = [1, 2, 3, 4, 5, 6];
      if (array.length > 3) {
        array.splice(3);
      }
      console.log(array); },
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
