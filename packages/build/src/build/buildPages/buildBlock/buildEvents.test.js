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

import { get } from '@lowdefy/helpers';
import buildPages from '../buildPages.js';
import testContext from '../../../test/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const auth = {
  public: true,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('block events actions array should map to try catch', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: [
                {
                  id: 'action_1',
                  type: 'Reset',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([]);
});

test('block events actions as try catch arrays', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_2',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([
    {
      id: 'action_2',
      type: 'Retry',
    },
  ]);
});

test('block events actions as try array and catch not defined.', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([]);
});

test('block events actions try not an array', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: {
                  id: 'action_1',
                  type: 'Reset',
                },
              },
            },
          },
        ],
      },
    ],
  };
  expect(() =>
    buildPages({
      components,
      context,
    })
  ).toThrow(
    'Try actions must be an array at "block_1" in event "onClick.try" on page "page_1". Received {"id":"action_1","type":"Reset"}'
  );
});

test('block events actions not an array', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {},
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Actions must be an array at "block_1" in event "onClick" on page "page_1". Received undefined'
  );
});

test('block events actions catch not an array', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [],
                catch: {
                  id: 'action_1',
                  type: 'Reset',
                },
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Catch actions must be an array at "block_1" in event "onClick.catch" on page "page_1". Received {"id":"action_1","type":"Reset"}'
  );
});

test('block events action id is not defined', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_1',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Action id missing on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('action type is not a string', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_1',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Action type is not a string on action "reset" on event "onClick" on block "block_1" on page "page_1". Received undefined.'
  );
});

test('block events action id is not a string', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: true,
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_1',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Action id is not a string on event "onClick" on block "block_1" on page "page_1". Received true.'
  );
});

test('throw on Duplicate block events action ids', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_2',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Duplicate actionId "action_1" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test("don't throw on Duplicate separate block events action ids", () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            events: {
              onClick: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_2',
                    type: 'Retry',
                  },
                ],
              },
              onChange: {
                try: [
                  {
                    id: 'action_1',
                    type: 'Reset',
                  },
                ],
                catch: [
                  {
                    id: 'action_2',
                    type: 'Retry',
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0')).toEqual({
    blockId: 'block_1',
    events: {
      onChange: {
        catch: [{ id: 'action_2', type: 'Retry' }],
        try: [{ id: 'action_1', type: 'Reset' }],
      },
      onClick: {
        catch: [{ id: 'action_2', type: 'Retry' }],
        try: [{ id: 'action_1', type: 'Reset' }],
      },
    },
    id: 'block:page_1:block_1:0',
    type: 'Input',
  });
});
