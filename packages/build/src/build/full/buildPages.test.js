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

import addKeys from '../addKeys.js';
import buildPages from './buildPages.js';
import testContext from '../../test-utils/testContext.js';

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

test('buildPages no pages', () => {
  const components = {};
  const res = buildPages({ components, context });
  expect(res.pages).toBe(undefined);
});

test('buildPages pages not an array', () => {
  const components = {
    pages: 'pages',
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: 'pages',
  });
});

test('page does not have an id', () => {
  const components = {
    pages: [
      {
        type: 'Container',
        auth,
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow('Page id missing at page 0.');
});

test('page id is not a string', () => {
  const components = {
    pages: [
      {
        id: true,
        type: 'Container',
        auth,
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow('Page id is not a string at page 0.');
});

test('page id is a reserved name', () => {
  const components = {
    pages: [
      {
        id: '__proto__',
        type: 'Container',
        auth,
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Page id "__proto__" is a reserved name and cannot be used as an id.'
  );
});

test('Throw on duplicate page ids', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
      },
      {
        id: 'page_1',
        type: 'Container',
        auth,
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow('Duplicate pageId "page_1".');
});

test('block does not have an id', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        auth,
        blocks: [
          {
            type: 'Input',
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow('Block id missing at page "page1".');
});

test('block id is not a string', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: true,
            type: 'Input',
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Block id is not a string at page "page1".'
  );
});

test('page type missing', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        auth,
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Block type is not defined at "page1" on page "page1".'
  );
});

test('block type missing', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'blockId',
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Block type is not defined at "blockId" on page "page1".'
  );
});

test('page type not a string', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 1,
        auth,
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Block type is not a string at "page1" on page "page1".'
  );
});

test('block type not a string', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'blockId',
            type: 1,
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Block type is not a string at "blockId" on page "page1".'
  );
});

test('no blocks on page', () => {
  const components = {
    pages: [
      {
        id: '1',
        type: 'Container',
        auth,
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:1',
        auth: { public: true },
        pageId: '1',
        blockId: '1',
        type: 'Container',
        subscriptions: [],
        requests: [],
      },
    ],
  });
});

test('blocks not an array', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        blocks: 'block_1',
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Blocks at page1 on page page1 is not an array.'
  );
});

test('block not an object', () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        blocks: ['block_1'],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Block should be an object on page "page1".'
  );
});

test('nested blocks', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Container',
            blocks: [
              {
                id: 'block_2',
                type: 'Input',
              },
            ],
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        subscriptions: [],
        requests: [],
        slots: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block_1:0',
                blockId: 'block_1',
                type: 'Container',
                slots: {
                  content: {
                    blocks: [
                      {
                        id: 'block:page_1:block_2:0',
                        blockId: 'block_2',
                        type: 'Input',
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ],
  });
});

describe('block areas', () => {
  test('content area blocks is not an array', () => {
    const components = {
      pages: [
        {
          id: 'page1',
          type: 'Container',
          auth,
          areas: {
            content: {
              blocks: 'string',
            },
          },
        },
      ],
    };
    expect(() => buildPages({ components, context })).toThrow(
      'Expected blocks to be an array at page1 in slot content on page page1.'
    );
  });

  test('Add array if area blocks is undefined', () => {
    const components = {
      pages: [
        {
          id: 'page1',
          type: 'Container',
          auth,
          areas: {
            content: {},
          },
        },
      ],
    };
    const res = buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page1',
          auth: { public: true },
          blockId: 'page1',
          pageId: 'page1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              blocks: [],
            },
          },
        },
      ],
    });
  });

  test('content area on page ', () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Container',
          auth,
          areas: {
            content: {
              blocks: [
                {
                  id: 'block1',
                  type: 'Input',
                },
              ],
            },
          },
        },
      ],
    };
    const res = buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          blockId: '1',
          pageId: '1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              blocks: [
                {
                  id: 'block:1:block1:0',
                  blockId: 'block1',
                  type: 'Input',
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('does not overwrite area layout', () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Container',
          auth,
          areas: {
            content: {
              gutter: 20,
              blocks: [
                {
                  id: 'block1',
                  type: 'Input',
                },
              ],
            },
          },
        },
      ],
    };
    const res = buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          blockId: '1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              gutter: 20,
              blocks: [
                {
                  id: 'block:1:block1:0',
                  blockId: 'block1',
                  type: 'Input',
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('multiple content areas on page ', () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Container',
          auth,
          areas: {
            content: {
              blocks: [
                {
                  id: 'textInput',
                  type: 'Input',
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'avatar',
                  type: 'Display',
                },
              ],
            },
          },
        },
      ],
    };
    const res = buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          blockId: '1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              blocks: [
                {
                  id: 'block:1:textInput:0',
                  blockId: 'textInput',
                  type: 'Input',
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'block:1:avatar:0',
                  blockId: 'avatar',
                  type: 'Display',
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('blocks array does not affect other content areas', () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Container',
          auth,
          blocks: [
            {
              id: 'textInput',
              type: 'Input',
            },
          ],
          areas: {
            header: {
              blocks: [
                {
                  id: 'avatar',
                  type: 'Display',
                },
              ],
            },
          },
        },
      ],
    };
    const res = buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          blockId: '1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              blocks: [
                {
                  id: 'block:1:textInput:0',
                  blockId: 'textInput',
                  type: 'Input',
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'block:1:avatar:0',
                  blockId: 'avatar',
                  type: 'Display',
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('blocks array overwrites areas.content', () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Container',
          auth,
          blocks: [
            {
              id: 'textInput',
              type: 'Input',
            },
          ],
          areas: {
            content: {
              blocks: [
                {
                  id: 'numberInput',
                  type: 'Input',
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'avatar',
                  type: 'Display',
                },
              ],
            },
          },
        },
      ],
    };
    const res = buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          blockId: '1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              blocks: [
                {
                  id: 'block:1:textInput:0',
                  blockId: 'textInput',
                  type: 'Input',
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'block:1:avatar:0',
                  blockId: 'avatar',
                  type: 'Display',
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('nested content areas ', () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Container',
          auth,
          blocks: [
            {
              id: 'card',
              type: 'Container',
              areas: {
                content: {
                  blocks: [
                    {
                      id: 'card2',
                      type: 'Container',
                      blocks: [
                        {
                          id: 'textInput',
                          type: 'Input',
                        },
                      ],
                      areas: {
                        title: {
                          blocks: [
                            {
                              id: 'title',
                              type: 'Display',
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                header: {
                  blocks: [
                    {
                      id: 'avatar',
                      type: 'Display',
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
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          blockId: '1',
          type: 'Container',
          subscriptions: [],
          requests: [],
          slots: {
            content: {
              blocks: [
                {
                  id: 'block:1:card:0',
                  blockId: 'card',
                  type: 'Container',
                  slots: {
                    content: {
                      blocks: [
                        {
                          id: 'block:1:card2:0',
                          blockId: 'card2',
                          type: 'Container',
                          slots: {
                            title: {
                              blocks: [
                                {
                                  id: 'block:1:title:0',
                                  blockId: 'title',
                                  type: 'Display',
                                },
                              ],
                            },
                            content: {
                              blocks: [
                                {
                                  id: 'block:1:textInput:0',
                                  blockId: 'textInput',
                                  type: 'Input',
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                    header: {
                      blocks: [
                        {
                          id: 'block:1:avatar:0',
                          blockId: 'avatar',
                          type: 'Display',
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  });
});

test('user defined skeleton', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        skeleton: [
          {
            custom: true,
          },
        ],
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            skeleton: [
              {
                custom: true,
              },
            ],
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        skeleton: [
          {
            custom: true,
          },
        ],
        subscriptions: [],
        requests: [],
        slots: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block_1:0',
                blockId: 'block_1',
                type: 'Input',
                skeleton: [
                  {
                    custom: true,
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  });
});

test('buildPages throws when a page has duplicate block ids', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block',
            type: 'Display',
          },
          {
            id: 'block',
            type: 'Display',
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Duplicate blockId "block" on page "page_1". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.'
  );
});

test('same block id may be used on different pages', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block',
            type: 'Display',
          },
        ],
      },
      {
        id: 'page_2',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block',
            type: 'Display',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        subscriptions: [],
        requests: [],
        slots: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block:0',
                blockId: 'block',
                type: 'Display',
              },
            ],
          },
        },
      },
      {
        id: 'page:page_2',
        auth: { public: true },
        pageId: 'page_2',
        blockId: 'page_2',
        type: 'Container',
        subscriptions: [],
        requests: [],
        slots: {
          content: {
            blocks: [
              {
                id: 'block:page_2:block:0',
                blockId: 'block',
                type: 'Display',
              },
            ],
          },
        },
      },
    ],
  });
});

const checkBlockMetas = {
  Container: { category: 'container' },
  Button: {
    category: 'display',
    events: {
      onClick: {
        description: 'Click.',
        payload: { type: 'object', properties: { value: { type: 'string' } } },
      },
    },
  },
};

const checkBlockSchemas = {
  Button: {
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' } },
      },
    },
  },
};

function createCollectingContext() {
  const collectingContext = testContext({ blockMetas: checkBlockMetas, logger });
  collectingContext.blockSchemas = checkBlockSchemas;
  collectingContext.errors = [];
  return collectingContext;
}

// One page carrying a bad block property, a misspelt event name and an _event
// path that is not in the declared payload, plus a later sibling block.
function componentsWithThreeCheckErrors(ignoreBuildChecks) {
  const page = {
    id: 'page_1',
    type: 'Container',
    auth,
    blocks: [
      {
        id: 'first',
        type: 'Button',
        properties: { titel: 'Save' },
        events: {
          onClik: [{ id: 'a', type: 'Reset' }],
          onClick: [{ id: 'b', type: 'SetState', params: { x: { _event: 'valu' } } }],
        },
      },
      { id: 'second', type: 'Button', properties: { title: 'Ok' } },
    ],
  };
  if (ignoreBuildChecks) {
    page['~ignoreBuildChecks'] = ignoreBuildChecks;
  }
  return { pages: [page] };
}

test('buildPages reports a block property, an event name and an event payload error in one build', () => {
  const collectingContext = createCollectingContext();
  const components = componentsWithThreeCheckErrors();
  addKeys({ components, context: collectingContext });
  buildPages({ components, context: collectingContext });

  expect(collectingContext.errors.map((error) => error.checkSlug).sort()).toEqual([
    'block-properties',
    'event-payload',
    'events',
  ]);
});

test('buildPages builds the whole page when its check errors are suppressed', () => {
  const collectingContext = createCollectingContext();
  const components = componentsWithThreeCheckErrors([
    'block-properties',
    'events',
    'event-payload',
  ]);
  addKeys({ components, context: collectingContext });
  const res = buildPages({ components, context: collectingContext });

  expect(collectingContext.errors).toEqual([]);
  const page = res.pages[0];
  expect(page.id).toBe('page:page_1');
  expect(page.pageId).toBe('page_1');
  expect(page.requests).toEqual([]);
  expect(page.subscriptions).toEqual([]);
  // The block after the one that failed its checks is still built.
  expect(page.slots.content.blocks.map((block) => block.id)).toEqual([
    'block:page_1:first:0',
    'block:page_1:second:0',
  ]);
});
