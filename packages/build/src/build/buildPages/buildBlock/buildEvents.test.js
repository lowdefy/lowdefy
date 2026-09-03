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

import { get } from '@lowdefy/helpers';
import buildPages from '../../full/buildPages.js';
import testContext from '../../../test-utils/testContext.js';

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
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.catch')).toEqual([]);
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
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.catch')).toEqual([
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
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.catch')).toEqual([]);
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
    'Try actions must be an array at "block_1" in event "onClick.try" on page "page_1".'
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
    'Actions must be an array at "block_1" in event "onClick" on page "page_1".'
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
    'Catch actions must be an array at "block_1" in event "onClick.catch" on page "page_1".'
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
    'Action type is not a string on action "reset" on event "onClick" on block "block_1" on page "page_1".'
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
    'Action id is not a string on event "onClick" on block "block_1" on page "page_1".'
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
  expect(get(res, 'pages.0.slots.content.blocks.0')).toEqual({
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

test('block events with controls keep the nested structure', () => {
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
                {
                  ':if': { _state: 'flag' },
                  ':then': [
                    {
                      id: 'action_2',
                      type: 'Reset',
                    },
                    {
                      ':switch': [
                        {
                          ':case': { _state: 'mode' },
                          ':then': [
                            {
                              id: 'action_3',
                              type: 'Reset',
                            },
                          ],
                        },
                      ],
                      ':default': [
                        {
                          ':return': null,
                        },
                      ],
                    },
                  ],
                  ':else': [
                    {
                      id: 'action_4',
                      type: 'Reset',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
    {
      ':if': { _state: 'flag' },
      ':then': [
        {
          id: 'action_2',
          type: 'Reset',
        },
        {
          ':switch': [
            {
              ':case': { _state: 'mode' },
              ':then': [
                {
                  id: 'action_3',
                  type: 'Reset',
                },
              ],
            },
          ],
          ':default': [
            {
              ':return': null,
            },
          ],
        },
      ],
      ':else': [
        {
          id: 'action_4',
          type: 'Reset',
        },
      ],
    },
  ]);
});

test('throw on duplicate action ids across control branches', () => {
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
                  ':if': true,
                  ':then': [
                    {
                      id: 'action_1',
                      type: 'Reset',
                    },
                  ],
                  ':else': [
                    {
                      id: 'action_1',
                      type: 'Reset',
                    },
                  ],
                },
              ],
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

test('throw on duplicate action id between try action and catch control branch', () => {
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
                    ':if': true,
                    ':then': [
                      {
                        id: 'action_1',
                        type: 'Reset',
                      },
                    ],
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

test('throw on control with more than one control key', () => {
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
                  ':if': true,
                  ':then': [],
                  ':return': null,
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control has more than one control key (":if", ":return") on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on control with action property id', () => {
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
                  ':if': true,
                  ':then': [],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":if" can not have action property "id" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on control with action property skip', () => {
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
                  ':return': null,
                  skip: true,
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":return" can not have action property "skip" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on control with action property messages', () => {
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
                  ':if': true,
                  ':then': [],
                  messages: { success: 'Done' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":if" can not have action property "messages" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on :if control without :then', () => {
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
                  ':if': true,
                  ':else': [],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":if" requires a ":then" list on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on :switch case without :then', () => {
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
                  ':switch': [
                    {
                      ':case': true,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":case" requires a ":then" list on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on :switch that is not an array', () => {
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
                  ':switch': { ':case': true, ':then': [] },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":switch" must be an array of case objects on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on :then that is not an array', () => {
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
                  ':if': true,
                  ':then': {
                    id: 'action_1',
                    type: 'Reset',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":then" must be an array on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('nested controls inside branches are validated', () => {
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
                  ':if': true,
                  ':then': [
                    {
                      ':if': true,
                      ':else': [],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":if" requires a ":then" list on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('branch actions are validated like ordinary actions', () => {
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
                  ':if': true,
                  ':then': [
                    {
                      type: 'Reset',
                    },
                  ],
                },
              ],
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

test('throw on control with an unknown key', () => {
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
                  ':if': true,
                  ':then': [],
                  ':esle': [
                    {
                      id: 'action_1',
                      type: 'Reset',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":if" has invalid key ":esle" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on control carrying an action type key', () => {
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
                  type: 'Reset',
                  ':if': true,
                  ':then': [],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":if" has invalid key "type" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on :switch case without :case', () => {
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
                  ':switch': [
                    {
                      ':then': [
                        {
                          id: 'action_1',
                          type: 'Reset',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":switch" case requires a ":case" condition on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('throw on :switch case with an unknown key', () => {
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
                  ':switch': [
                    {
                      ':case': true,
                      ':then': [],
                      ':default': [],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Control ":switch" case has invalid key ":default" on event "onClick" on block "block_1" on page "page_1".'
  );
});

test('event shortcut that is a reserved name throws a located error', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Button',
            events: {
              onClick: {
                shortcut: '__proto__',
                try: [{ id: 'action_1', type: 'Reset' }],
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Event shortcut "__proto__" on event "onClick" on block "block_1" on page "page_1" is a reserved name and cannot be used as a shortcut.'
  );
  try {
    buildPages({ components, context });
  } catch (e) {
    expect(e.configKey).toBeDefined();
  }
});

test('event shortcut that only contains a reserved name as a modified key is accepted', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Button',
            events: {
              onClick: {
                shortcut: 'Ctrl+__proto__',
                try: [{ id: 'action_1', type: 'Reset' }],
              },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).not.toThrow();
});
