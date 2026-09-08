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

import validateFragment from './validateFragment.js';

const blockSchemas = {
  Statistic: {
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          value: { type: 'number' },
        },
      },
    },
  },
};

function createContext(files = {}) {
  return {
    readConfigFile: jest.fn((path) => files[path] ?? null),
  };
}

const defaultArgs = {
  blockSchemas,
  callApiActionRefs: [],
  dynamicBlockId: 'section_1',
  pageId: 'page1',
  pageRequests: [],
  requestActionRefs: [],
};

test('validateFragment passes valid block properties', async () => {
  const blocks = [
    {
      blockId: 'stat',
      type: 'Statistic',
      properties: { title: 'Users', value: 12 },
    },
  ];
  await validateFragment(createContext(), { ...defaultArgs, blocks });
});

test('validateFragment throws on a schema violation on an operator-free path', async () => {
  const blocks = [
    {
      blockId: 'stat',
      type: 'Statistic',
      properties: { title: 'Users', value: 'twelve' },
    },
  ];
  await expect(validateFragment(createContext(), { ...defaultArgs, blocks })).rejects.toThrow(
    'Dynamic block "section_1" on page "page1" resolved block "stat" (Statistic) has invalid properties'
  );
  await expect(validateFragment(createContext(), { ...defaultArgs, blocks })).rejects.toThrow(
    'properties/value must be number'
  );
});

test('validateFragment discards schema violations at operator paths', async () => {
  const blocks = [
    {
      blockId: 'stat',
      type: 'Statistic',
      properties: { title: 'Users', value: { _state: 'user_count' } },
    },
  ];
  await validateFragment(createContext(), { ...defaultArgs, blocks });
});

test('validateFragment skips validation when properties is an operator', async () => {
  const blocks = [
    {
      blockId: 'stat',
      type: 'Statistic',
      properties: { _state: 'stat_props' },
    },
  ];
  await validateFragment(createContext(), { ...defaultArgs, blocks });
});

test('validateFragment skips blocks without a schema', async () => {
  const blocks = [
    {
      blockId: 'custom',
      type: 'CustomBlock',
      properties: { anything: [1, 2, 3] },
    },
  ];
  await validateFragment(createContext(), { ...defaultArgs, blocks });
});

test('validateFragment validates nested blocks inside slots', async () => {
  const blocks = [
    {
      blockId: 'wrapper',
      type: 'Box',
      slots: {
        content: {
          blocks: [
            {
              blockId: 'stat',
              type: 'Statistic',
              properties: { value: 'not a number' },
            },
          ],
        },
      },
    },
  ];
  await expect(validateFragment(createContext(), { ...defaultArgs, blocks })).rejects.toThrow(
    'resolved block "stat" (Statistic) has invalid properties'
  );
});

test('validateFragment throws when a Request action references an undefined page request', async () => {
  await expect(
    validateFragment(createContext(), {
      ...defaultArgs,
      blocks: [],
      pageRequests: [{ requestId: 'get_data' }],
      requestActionRefs: [{ requestId: 'missing_request', blockId: 'btn', eventId: 'onClick' }],
    })
  ).rejects.toThrow(
    'references request "missing_request" on event "onClick" on block "btn" which is not defined on the page.'
  );
});

test('validateFragment allows Request actions referencing page requests', async () => {
  await validateFragment(createContext(), {
    ...defaultArgs,
    blocks: [],
    pageRequests: [{ requestId: 'get_data' }],
    requestActionRefs: [{ requestId: 'get_data', blockId: 'btn', eventId: 'onClick' }],
  });
});

test('validateFragment throws when a CallAPI action targets a missing endpoint', async () => {
  await expect(
    validateFragment(createContext(), {
      ...defaultArgs,
      blocks: [],
      callApiActionRefs: [{ endpointId: 'missing', blockId: 'btn', eventId: 'onClick' }],
    })
  ).rejects.toThrow(
    'targeting endpoint "missing" which does not exist or is not accessible from client pages.'
  );
});

test('validateFragment throws when a CallAPI action targets an InternalApi endpoint', async () => {
  const context = createContext({
    'api/internal.json': { endpointId: 'internal', type: 'InternalApi' },
  });
  await expect(
    validateFragment(context, {
      ...defaultArgs,
      blocks: [],
      callApiActionRefs: [{ endpointId: 'internal', blockId: 'btn', eventId: 'onClick' }],
    })
  ).rejects.toThrow('targeting endpoint "internal" which does not exist or is not accessible');
});

test('validateFragment allows CallAPI actions targeting Api endpoints', async () => {
  const context = createContext({
    'api/public.json': { endpointId: 'public', type: 'Api' },
  });
  await validateFragment(context, {
    ...defaultArgs,
    blocks: [],
    callApiActionRefs: [{ endpointId: 'public', blockId: 'btn', eventId: 'onClick' }],
  });
});
