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
  ).toThrow('Try actions must be an array at "block_1" in event "onClick.try" on page "page_1".');
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

test('SetActiveOrganization action wired under the default pinned policy fails the build', () => {
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
              onClick: [
                {
                  id: 'set_active',
                  type: 'SetActiveOrganization',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'SetActiveOrganization action on page "page_1" is not allowed under the "pinned" organizations policy - the per-organization client endpoints are disabled for a pinned deployment.'
  );
});

test('SetActiveOrganization action wired under an explicit pinned policy fails the build', () => {
  const components = {
    auth: { organizations: { policy: 'pinned' } },
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
              onClick: [
                {
                  id: 'set_active',
                  type: 'SetActiveOrganization',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'SetActiveOrganization action on page "page_1" is not allowed under the "pinned" organizations policy - the per-organization client endpoints are disabled for a pinned deployment.'
  );
});

test('SetActiveOrganization action wired under the tenant policy builds cleanly', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
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
              onClick: [
                {
                  id: 'set_active',
                  type: 'SetActiveOrganization',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('non-org-client actions do not trigger the pinned policy build error', () => {
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
              onClick: [
                {
                  id: 'reset',
                  type: 'Reset',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('SetActiveOrganization action wired under the default pinned policy fails the build', () => {
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
              onClick: [
                {
                  id: 'set_active_organization',
                  type: 'SetActiveOrganization',
                  params: { organizationId: 'org-1' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'SetActiveOrganization action on page "page_1" is not allowed under the "pinned" organizations policy - the per-organization client endpoints are disabled for a pinned deployment.'
  );
});

test('SetActiveOrganization action wired under the tenant policy builds cleanly', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
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
              onClick: [
                {
                  id: 'set_active_organization',
                  type: 'SetActiveOrganization',
                  params: { organizationId: 'org-1' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).not.toThrow();
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

const textInputPayload = {
  type: 'object',
  additionalProperties: false,
  properties: {
    value: {
      type: 'object',
      additionalProperties: false,
      properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' } },
      },
    },
    extra: { type: 'object' },
  },
};

const blockMetas = {
  Button: { category: 'display', events: { onClick: {} } },
  Container: { category: 'container' },
  TextInput: {
    category: 'input',
    events: { onChange: { payload: textInputPayload }, onEnterKeyPress: {} },
  },
  Selector: {
    category: 'input',
    events: {
      onChange: {
        payload: { type: 'object', properties: { value: { description: 'The selected value.' } } },
      },
    },
  },
  AgGrid: { category: 'display' },
  Tabs: { category: 'container', dynamicEvents: true, events: { onChange: {} } },
};

const metaContext = testContext({ blockMetas, logger });

function pageWithBlockEvents(events, { blockType = 'Button' } = {}) {
  return {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: blockType,
            events,
          },
        ],
      },
    ],
  };
}

test('buildEvents throws on an event name the block type does not declare', () => {
  const components = pageWithBlockEvents({
    onHover: [{ id: 'action_1', type: 'Reset' }],
  });
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    'Event "onHover" is not an event of block type "Button" at block "block_1" on page "page_1". Block type "Button" has events: onClick. Every block also accepts onMount and onMountAsync, and any event name that declares a shortcut.'
  );
});

test('buildEvents suggests the closest declared event name', () => {
  const components = pageWithBlockEvents({
    onClik: [{ id: 'action_1', type: 'Reset' }],
  });
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    'Event "onClik" is not an event of block type "Button" at block "block_1" on page "page_1". Did you mean "onClick"? Block type "Button" has events: onClick.'
  );
});

test('buildEvents throws with checkSlug events', () => {
  const components = pageWithBlockEvents({
    onHover: [{ id: 'action_1', type: 'Reset' }],
  });
  try {
    buildPages({ components, context: metaContext });
    throw new Error('Expected buildPages to throw.');
  } catch (error) {
    expect(error.checkSlug).toBe('events');
  }
});

test('buildEvents allows onMount and onMountAsync on any block', () => {
  const components = pageWithBlockEvents({
    onMount: [{ id: 'action_1', type: 'Reset' }],
    onMountAsync: [{ id: 'action_2', type: 'Reset' }],
  });
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents allows onInit on the page root block', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        events: {
          onInit: [{ id: 'action_1', type: 'Reset' }],
          onInitAsync: [{ id: 'action_2', type: 'Reset' }],
        },
        blocks: [],
      },
    ],
  };
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents throws on onInit on a nested block', () => {
  const components = pageWithBlockEvents({
    onInit: [{ id: 'action_1', type: 'Reset' }],
  });
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    'Event "onInit" only fires on the page\'s root block, not on block "block_1" on page "page_1". Move it to the page\'s own events, or use onMount, which fires on every block.'
  );
});

test('buildEvents allows any event name that declares a shortcut', () => {
  const components = pageWithBlockEvents({
    cmd_k_search: {
      shortcut: 'mod+k',
      try: [{ id: 'action_1', type: 'Reset' }],
    },
  });
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents skips the check for a block type whose meta declares no events', () => {
  const components = pageWithBlockEvents(
    { onRowClick: [{ id: 'action_1', type: 'Reset' }] },
    { blockType: 'AgGrid' }
  );
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents skips the check for a block type that is not in blockMetas', () => {
  const components = pageWithBlockEvents(
    { onAnything: [{ id: 'action_1', type: 'Reset' }] },
    { blockType: 'LocalPluginBlock' }
  );
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents suppresses the error under ~ignoreBuildChecks events', () => {
  const suppressContext = testContext({ blockMetas, logger });
  suppressContext.keyMap = {
    event_key: { key: 'pages.0.blocks.0.events.onHover', '~ignoreBuildChecks': ['events'] },
  };
  const components = pageWithBlockEvents({
    onHover: {
      '~k': 'event_key',
      try: [{ id: 'action_1', type: 'Reset' }],
    },
  });
  expect(() => buildPages({ components, context: suppressContext })).not.toThrow();
});

test('buildEvents warns rather than errors on an unknown event name of a dynamicEvents block', () => {
  const components = pageWithBlockEvents(
    { onApprove: [{ id: 'action_1', type: 'Reset' }] },
    { blockType: 'Tabs' }
  );
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Event "onApprove" is not a declared event of block type "Tabs" at block "block_1" on page "page_1". Block type "Tabs" fires event names authored in its properties, so this event only fires if a property names it as its eventName. Declared events: onChange.'
  );
});

test('buildEvents errors on a near miss of a declared event name of a dynamicEvents block', () => {
  const components = pageWithBlockEvents(
    { onChang: [{ id: 'action_1', type: 'Reset' }] },
    { blockType: 'Tabs' }
  );
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    'Event "onChang" is not an event of block type "Tabs" at block "block_1" on page "page_1". Did you mean "onChange"?'
  );
});

test('buildEvents is silent on a dynamicEvents event name authored in the block properties', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Tabs',
            properties: { tabs: [{ key: 'a', eventName: 'onApprove' }] },
            events: { onApprove: [{ id: 'action_1', type: 'Reset' }] },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('buildEvents errors when events is an array instead of a map of event names', () => {
  const components = pageWithBlockEvents([{ id: 'action_1', type: 'Reset' }]);
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    'Block "block_1" on page "page_1" events must be a map of event name to actions. Received [{"id":"action_1","type":"Reset"}].'
  );
});

function textInputChange(actions, blockType = 'TextInput') {
  return pageWithBlockEvents({ onChange: actions }, { blockType });
}

test('buildEvents resolves _event paths declared in the event payload', () => {
  const components = textInputChange([
    {
      id: 'store',
      type: 'SetState',
      params: {
        whole: { _event: 'value' },
        name: { _event: 'value.name' },
        tag: { _event: 'value.tags.0' },
        tagBracket: { _event: 'value.tags[1]' },
        itemId: { _event: 'items.0.id' },
        withDefault: { _event: { key: 'value.name', default: 'x' } },
        open: { _event: 'extra.anything.goes' },
      },
    },
  ]);
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents throws on a mistyped _event leaf with the payload keys and a suggestion', () => {
  const components = textInputChange([
    { id: 'store', type: 'SetState', params: { raw: { _event: 'valu' } } },
  ]);
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    '_event "valu" in event "onChange" on block "block_1" (TextInput) is not in the event payload. Payload: value, items, extra. Did you mean "value"?'
  );
});

test('buildEvents throws on a mistyped nested _event path and suggests the full path', () => {
  const components = textInputChange([
    { id: 'store', type: 'SetState', params: { raw: { _event: 'value.nme' } } },
  ]);
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    '_event "value.nme" in event "onChange" on block "block_1" (TextInput) is not in the event payload. Payload: value, items, extra. Did you mean "value.name"?'
  );
});

test('buildEvents throws on an _event path into array items with the wrong key', () => {
  const components = textInputChange([
    { id: 'store', type: 'SetState', params: { raw: { _event: 'items.0.idd' } } },
  ]);
  expect(() => buildPages({ components, context: metaContext })).toThrow(
    '_event "items.0.idd" in event "onChange" on block "block_1" (TextInput) is not in the event payload. Payload: value, items, extra. Did you mean "items.0.id"?'
  );
});

test('buildEvents _event payload error carries checkSlug event-payload and the operator configKey', () => {
  const components = textInputChange([
    {
      id: 'store',
      type: 'SetState',
      params: { raw: { '~k': 'operator_key', _event: 'valu' } },
    },
  ]);
  try {
    buildPages({ components, context: metaContext });
    throw new Error('Expected buildPages to throw.');
  } catch (error) {
    expect(error.checkSlug).toBe('event-payload');
    expect(error.configKey).toBe('operator_key');
  }
});

test('buildEvents checks _event paths in catch actions, messages and control branches', () => {
  const inCatch = pageWithBlockEvents(
    {
      onChange: {
        try: [],
        catch: [{ id: 'store', type: 'SetState', params: { raw: { _event: 'valu' } } }],
      },
    },
    { blockType: 'TextInput' }
  );
  expect(() => buildPages({ components: inCatch, context: metaContext })).toThrow(
    '_event "valu" in event "onChange"'
  );
  const inMessages = textInputChange([
    {
      id: 'store',
      type: 'SetState',
      params: {},
      messages: { success: { _event: 'valu' } },
    },
  ]);
  expect(() => buildPages({ components: inMessages, context: metaContext })).toThrow(
    '_event "valu" in event "onChange"'
  );
  const inControl = textInputChange([
    {
      ':if': { _event: 'value.name' },
      ':then': [{ id: 'store', type: 'SetState', params: { raw: { _event: 'valu' } } }],
    },
  ]);
  expect(() => buildPages({ components: inControl, context: metaContext })).toThrow(
    '_event "valu" in event "onChange"'
  );
});

test('buildEvents skips _event true, integer and operator-supplied key forms', () => {
  const components = textInputChange([
    {
      id: 'store',
      type: 'SetState',
      params: {
        all: { _event: true },
        index: { _event: 0 },
        computed: { _event: { key: { _state: 'path' } } },
        cleared: { _event: { key: null, default: 1 } },
      },
    },
  ]);
  expect(() => buildPages({ components, context: metaContext })).not.toThrow();
});

test('buildEvents never checks _event paths on an event with no declared payload', () => {
  const noPayloadEvent = pageWithBlockEvents(
    { onEnterKeyPress: [{ id: 'store', type: 'SetState', params: { raw: { _event: 'valu' } } }] },
    { blockType: 'TextInput' }
  );
  expect(() => buildPages({ components: noPayloadEvent, context: metaContext })).not.toThrow();
  const stringFormEvent = pageWithBlockEvents({
    onClick: [{ id: 'store', type: 'SetState', params: { raw: { _event: 'anything' } } }],
  });
  expect(() => buildPages({ components: stringFormEvent, context: metaContext })).not.toThrow();
  const unknownBlock = pageWithBlockEvents(
    { onChange: [{ id: 'store', type: 'SetState', params: { raw: { _event: 'anything' } } }] },
    { blockType: 'LocalPluginBlock' }
  );
  expect(() => buildPages({ components: unknownBlock, context: metaContext })).not.toThrow();
});

test('buildEvents checks the top level of a legacy description-only payload but not below it', () => {
  const nested = textInputChange(
    [{ id: 'store', type: 'SetState', params: { raw: { _event: 'value.anything.below' } } }],
    'Selector'
  );
  expect(() => buildPages({ components: nested, context: metaContext })).not.toThrow();
  const mistyped = textInputChange(
    [{ id: 'store', type: 'SetState', params: { raw: { _event: 'valu' } } }],
    'Selector'
  );
  expect(() => buildPages({ components: mistyped, context: metaContext })).toThrow(
    '_event "valu" in event "onChange" on block "block_1" (Selector) is not in the event payload. Payload: value. Did you mean "value"?'
  );
});

test('buildEvents suppresses the _event payload error under ~ignoreBuildChecks event-payload', () => {
  const suppressContext = testContext({ blockMetas, logger });
  suppressContext.keyMap = {
    event_key: {
      key: 'pages.0.blocks.0.events.onChange',
      '~ignoreBuildChecks': ['event-payload'],
    },
    operator_key: {
      key: 'pages.0.blocks.0.events.onChange.try.0.params.raw',
      '~k_parent': 'event_key',
    },
  };
  const components = pageWithBlockEvents(
    {
      onChange: {
        '~k': 'event_key',
        try: [
          {
            id: 'store',
            type: 'SetState',
            params: { raw: { '~k': 'operator_key', _event: 'valu' } },
          },
        ],
      },
    },
    { blockType: 'TextInput' }
  );
  expect(() => buildPages({ components, context: suppressContext })).not.toThrow();
});

test('buildEvents reports every _event path that is not in the payload in one build', () => {
  const collectingContext = testContext({ blockMetas, logger });
  collectingContext.errors = [];
  const components = textInputChange([
    {
      id: 'store',
      type: 'SetState',
      params: { a: { _event: 'valu' }, b: { _event: 'other' } },
    },
  ]);
  buildPages({ components, context: collectingContext });
  expect(collectingContext.errors).toHaveLength(2);
  expect(collectingContext.errors.every((error) => error.checkSlug === 'event-payload')).toBe(true);
});
