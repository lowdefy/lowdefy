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

import testSchema from './testSchema.js';
import testContext from '../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const context = testContext({ logger: { warn: mockLogWarn } });

beforeEach(() => {
  mockLogWarn.mockReset();
});

function appWith(ignoreBuildChecks) {
  return {
    lowdefy: '1.0.0',
    '~ignoreBuildChecks': ignoreBuildChecks,
    connections: [{ id: 'c1', type: 'AxiosHttp', '~ignoreBuildChecks': ignoreBuildChecks }],
    pages: [
      {
        id: 'p1',
        type: 'Box',
        '~ignoreBuildChecks': ignoreBuildChecks,
        blocks: [{ id: 'b1', type: 'TextInput', '~ignoreBuildChecks': ignoreBuildChecks }],
        requests: [
          {
            id: 'r1',
            type: 'AxiosHttp',
            connectionId: 'c1',
            '~ignoreBuildChecks': ignoreBuildChecks,
          },
        ],
        events: {
          onInit: [{ id: 'a1', type: 'SetState', '~ignoreBuildChecks': ignoreBuildChecks }],
        },
      },
    ],
  };
}

test('testSchema accepts plugin rule slugs in ~ignoreBuildChecks', () => {
  testSchema({ components: appWith(['if-test', 'plugin-checks']), context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('testSchema accepts built-in slugs outside the old eight-slug enum', () => {
  testSchema({ components: appWith(['icons', 'secrets', 'callmethod-refs']), context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('testSchema accepts true in ~ignoreBuildChecks', () => {
  testSchema({ components: appWith(true), context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('testSchema warns on a slug that is not kebab-case', () => {
  testSchema({
    components: { lowdefy: '1.0.0', '~ignoreBuildChecks': ['Not_Kebab'] },
    context,
  });
  expect(mockLogWarn).toHaveBeenCalled();
});
