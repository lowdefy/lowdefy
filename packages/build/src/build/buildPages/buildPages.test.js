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

import buildPages from './buildPages.js';
import testContext from '../../test/testContext.js';

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
  expect(() => buildPages({ components, context })).toThrow(
    'Page id is not a string at page 0. Received true.'
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
    'Block id is not a string at page "page1". Received true.'
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
    'Block type is not a string at "page1" on page "page1". Received 1.'
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
    'Block type is not a string at "blockId" on page "page1". Received 1.'
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
    'Blocks at page1 on page page1 is not an array. Received "block_1"'
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
    'Expected block to be an object on page "page1". Received "block_1".'
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
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block_1:0',
                blockId: 'block_1',
                type: 'Container',
                areas: {
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
      'Expected blocks to be an array at page1 in area content on page page1. Received "string"'
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
          requests: [],
          areas: {
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
          requests: [],
          areas: {
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
          requests: [],
          areas: {
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
          requests: [],
          areas: {
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
          requests: [],
          areas: {
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
          requests: [],
          areas: {
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
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:1:card:0',
                  blockId: 'card',
                  type: 'Container',
                  areas: {
                    content: {
                      blocks: [
                        {
                          id: 'block:1:card2:0',
                          blockId: 'card2',
                          type: 'Container',
                          areas: {
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
        requests: [],
        areas: {
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

test('create unique block ids', () => {
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
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block:0',
                blockId: 'block',
                type: 'Display',
              },
              {
                id: 'block:page_1:block:1',
                blockId: 'block',
                type: 'Display',
              },
              {
                id: 'block:page_1:block:2',
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

test('different blockId counter for each page', () => {
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
      {
        id: 'page_2',
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
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block:0',
                blockId: 'block',
                type: 'Display',
              },
              {
                id: 'block:page_1:block:1',
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
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_2:block:0',
                blockId: 'block',
                type: 'Display',
              },
              {
                id: 'block:page_2:block:1',
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
