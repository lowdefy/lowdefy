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

import writeJs from './writeJs.js';
import testContext from '../../test-utils/testContext.js';

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
  'A': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) => { return 12; },
  'B': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) => { return 1; },
  };`,
    ],
    [
      'plugins/operators/serverJsMap.js',
      `
export default {
  'C': ({ args, item, lowdefyApp, payload, secret, state, step, user }) => { return 10; },
  'D': ({ args, item, lowdefyApp, payload, secret, state, step, user }) => { return 1; },
  };`,
    ],
    ['js/serverModules.json', '[]'],
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
  'A': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) => { const parts = input.split('-').filter(part => part);
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
  'C': ({ args, item, lowdefyApp, payload, secret, state, step, user }) => { let array = [1, 2, 3, 4, 5, 6];
      if (array.length > 3) {
        array.splice(3);
      }
      console.log(array); },
  };`,
    ],
    ['js/serverModules.json', '[]'],
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
    ['js/serverModules.json', '[]'],
  ]);
});

test('writeJs imports modules in place in dev and from the server copy in prod, and lists server modules', async () => {
  context.directories = { config: '/app', build: '/srv/build', server: '/srv' };
  context.jsMap = { client: { A: 'return 1;' }, server: {} };
  context.jsModules = {
    client: {
      H1: {
        absolutePath: '/app/pages/lib/rows.js',
        exportName: 'buildRows',
        relativePath: 'pages/lib/rows.js',
      },
    },
    server: {
      H2: { absolutePath: '/app/lib/x.js', exportName: 'default', relativePath: 'lib/x.js' },
      H0: { absolutePath: '/app/lib/a.js', exportName: 'a', relativePath: 'lib/a.js' },
    },
  };

  context.stage = 'dev';
  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls[0][1]).toBe(`
import { buildRows as m0 } from '../../../../app/pages/lib/rows.js';

export default {
  'A': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) => { return 1; },
  'H1': m0,
  };`);
  expect(mockWriteBuildArtifact.mock.calls[1][1]).toBe(`
import { a as m0 } from '../../../../app/lib/a.js';
import m1 from '../../../../app/lib/x.js';

export default {
  'H0': m0,
  'H2': m1,
  };`);
  expect(mockWriteBuildArtifact.mock.calls[2]).toEqual([
    'js/serverModules.json',
    JSON.stringify(['/app/lib/a.js', '/app/lib/x.js']),
  ]);

  mockWriteBuildArtifact.mockReset();
  context.stage = 'prod';
  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls[0][1]).toContain(
    "import { buildRows as m0 } from '../../../pages/lib/rows.js';"
  );
  expect(mockWriteBuildArtifact.mock.calls[1][1]).toContain("import m1 from '../../../lib/x.js';");
  context.stage = 'test';
  context.directories = { config: '', build: 'build', server: '' };
});

test('writeJs always writes js/serverModules.json, as [] when there are no server modules', async () => {
  context.jsMap = { client: {}, server: {} };
  context.jsModules = { client: {}, server: {} };
  await writeJs({ context });
  expect(mockWriteBuildArtifact.mock.calls[2]).toEqual(['js/serverModules.json', '[]']);
});
