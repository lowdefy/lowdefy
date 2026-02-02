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

import validateStateReferences from './validateStateReferences.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('validateStateReferences does not throw when blockId is a non-string value', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blocks: [
      {
        blockId: { _nunjucks: '{{ id }}' },
        type: 'TextInput',
      },
    ],
  };
  expect(() => validateStateReferences({ page, context })).not.toThrow();
});

test('validateStateReferences handles blockId as number without throwing', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blocks: [
      {
        blockId: 123,
        type: 'TextInput',
      },
    ],
  };
  expect(() => validateStateReferences({ page, context })).not.toThrow();
});

test('validateStateReferences warns for undefined state reference', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blocks: [
      {
        blockId: 'name',
        type: 'TextInput',
      },
      {
        properties: {
          title: { _state: 'missing_field' },
        },
      },
    ],
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "missing_field"');
});

test('validateStateReferences does not warn for valid state reference', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blocks: [
      {
        blockId: 'user_name',
        type: 'TextInput',
      },
      {
        properties: {
          title: { _state: 'user_name' },
        },
      },
    ],
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences does not warn for state initialized via SetState', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blocks: [
      {
        events: {
          onClick: [
            {
              type: 'SetState',
              params: {
                panels_expanded: true,
              },
            },
          ],
        },
        properties: {
          visible: { _state: 'panels_expanded' },
        },
      },
    ],
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences handles dot-notation blockId', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blocks: [
      {
        blockId: 'user.profile.name',
        type: 'TextInput',
      },
      {
        properties: {
          title: { _state: 'user.profile.name' },
        },
      },
    ],
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});
