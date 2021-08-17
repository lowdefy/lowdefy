/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { get } from '@lowdefy/helpers';
import buildPages from './buildPages';
import testContext from '../../test/testContext';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const blockMetas = {
  Context: {
    category: 'context',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Context',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  Container: {
    category: 'container',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Container',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  List: {
    category: 'list',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'List',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  Input: {
    category: 'input',
    valueType: 'string',
    loading: {
      type: 'SkeletonInput',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Input',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
  Display: {
    category: 'display',
    loading: {
      type: 'Spinner',
    },
    moduleFederation: {
      scope: 'blocks',
      module: 'Display',
      url: 'https://example.com/remoteEntry.js',
    },
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/Container.json',
    },
  },
};

const outputMetas = {
  Context: {
    category: 'context',
    moduleFederation: {
      scope: 'blocks',
      module: 'Context',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
  },
  Container: {
    category: 'container',
    moduleFederation: {
      scope: 'blocks',
      module: 'Container',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
  },
  List: {
    category: 'list',
    moduleFederation: {
      scope: 'blocks',
      module: 'List',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
    valueType: 'array',
  },
  Input: {
    category: 'input',
    moduleFederation: {
      scope: 'blocks',
      module: 'Input',
      url: 'https://example.com/remoteEntry.js',
    },
    valueType: 'string',
    loading: {
      type: 'SkeletonInput',
    },
  },
  Display: {
    category: 'display',
    moduleFederation: {
      scope: 'blocks',
      module: 'Display',
      url: 'https://example.com/remoteEntry.js',
    },
    loading: {
      type: 'Spinner',
    },
  },
};

const auth = {
  public: true,
};

const getMeta = (type) => {
  const meta = blockMetas[type];
  if (!meta) {
    return null;
  }
  return Promise.resolve(meta);
};

const context = testContext({ logger, getMeta });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('buildPages no pages', async () => {
  const components = {};
  const res = await buildPages({ components, context });
  expect(res.pages).toBe(undefined);
});

test('buildPages pages not an array', async () => {
  const components = {
    pages: 'pages',
  };
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: 'pages',
  });
});

test('page does not have an id', async () => {
  const components = {
    pages: [
      {
        type: 'Context',
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow('Page id missing at page 0.');
});

test('page id is not a string', async () => {
  const components = {
    pages: [
      {
        id: true,
        type: 'Context',
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Page id is not a string at at page 0. Received true.'
  );
});

test('block does not have an id', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
        auth,
        blocks: [
          {
            type: 'Input',
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block id missing at page "page1".'
  );
});

test('block id is not a string', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block id is not a string at page "page1". Received true.'
  );
});

test('page type missing', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Page type is not defined at page1.'
  );
});

test('block type missing', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
        auth,
        blocks: [
          {
            id: 'blockId',
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block type is not defined at blockId on page page1.'
  );
});

test('invalid page type', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'NotABlock',
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Invalid block type at page page1. Received "NotABlock"'
  );
});

test('invalid block type', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
        auth,
        blocks: [
          {
            id: 'blockId',
            type: 'NotABlock',
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Invalid Block type at blockId on page page1. Received "NotABlock"'
  );
});

test('page type not a string', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 1,
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Page type is not a string at page1. Received 1'
  );
});

test('block type not a string', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block type is not a string at blockId on page page1. Received 1'
  );
});

test('page type is not of category context', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Page page1 is not of category "context". Received "Container"'
  );
});

test('no blocks on page', async () => {
  const components = {
    pages: [
      {
        id: '1',
        type: 'Context',
        auth,
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:1',
        auth: { public: true },
        operators: [],
        pageId: '1',
        blockId: '1',
        type: 'Context',
        meta: outputMetas.Context,
        requests: [],
      },
    ],
  });
});

test('blocks not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
        blocks: 'block_1',
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Blocks at page1 on page page1 is not an array. Received "block_1"'
  );
});

test('block not an object', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
        blocks: ['block_1'],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Expected block to be an object on page1. Received "block_1"'
  );
});

test('block meta should include all meta fields', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
          },
          {
            id: 'block_2',
            type: 'Display',
          },
          {
            id: 'block_3',
            type: 'List',
          },
        ],
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        operators: [],
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Context',
        meta: outputMetas.Context,
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block_1',
                blockId: 'block_1',
                type: 'Input',
                meta: outputMetas.Input,
              },
              {
                id: 'block:page_1:block_2',
                blockId: 'block_2',
                type: 'Display',
                meta: outputMetas.Display,
              },
              {
                id: 'block:page_1:block_3',
                blockId: 'block_3',
                type: 'List',
                meta: outputMetas.List,
              },
            ],
          },
        },
      },
    ],
  });
});

test('nested blocks', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
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
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        operators: [],
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Context',
        meta: outputMetas.Context,
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block_1',
                blockId: 'block_1',
                type: 'Container',
                meta: outputMetas.Container,
                areas: {
                  content: {
                    blocks: [
                      {
                        id: 'block:page_1:block_2',
                        blockId: 'block_2',
                        type: 'Input',
                        meta: outputMetas.Input,
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
  test('content area blocks is not an array', async () => {
    const components = {
      pages: [
        {
          id: 'page1',
          type: 'Context',
          auth,
          areas: {
            content: {
              blocks: 'string',
            },
          },
        },
      ],
    };
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Expected blocks to be an array at page1 in area content on page page1. Received "string"'
    );
  });

  test('Add array if area blocks is undefined', async () => {
    const components = {
      pages: [
        {
          id: 'page1',
          type: 'Context',
          auth,
          areas: {
            content: {},
          },
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page1',
          auth: { public: true },
          blockId: 'page1',
          operators: [],
          pageId: 'page1',
          type: 'Context',
          meta: outputMetas.Context,
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

  test('content area on page ', async () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Context',
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          blockId: '1',
          operators: [],
          pageId: '1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:1:block1',
                  blockId: 'block1',
                  type: 'Input',
                  meta: outputMetas.Input,
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('does not overwrite area layout', async () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Context',
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          operators: [],
          blockId: '1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              gutter: 20,
              blocks: [
                {
                  id: 'block:1:block1',
                  blockId: 'block1',
                  type: 'Input',
                  meta: outputMetas.Input,
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('multiple content areas on page ', async () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Context',
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:1:textInput',
                  blockId: 'textInput',
                  type: 'Input',
                  meta: outputMetas.Input,
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'block:1:avatar',
                  blockId: 'avatar',
                  type: 'Display',
                  meta: outputMetas.Display,
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('blocks array does not affect other content areas', async () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Context',
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:1:textInput',
                  blockId: 'textInput',
                  type: 'Input',
                  meta: outputMetas.Input,
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'block:1:avatar',
                  blockId: 'avatar',
                  type: 'Display',
                  meta: outputMetas.Display,
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('blocks array overwrites areas.content', async () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Context',
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:1:textInput',
                  blockId: 'textInput',
                  type: 'Input',
                  meta: outputMetas.Input,
                },
              ],
            },
            header: {
              blocks: [
                {
                  id: 'block:1:avatar',
                  blockId: 'avatar',
                  type: 'Display',
                  meta: outputMetas.Display,
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('nested content areas ', async () => {
    const components = {
      pages: [
        {
          id: '1',
          type: 'Context',
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:1:card',
                  blockId: 'card',
                  type: 'Container',
                  meta: outputMetas.Container,
                  areas: {
                    content: {
                      blocks: [
                        {
                          id: 'block:1:card2',
                          blockId: 'card2',
                          type: 'Container',
                          meta: outputMetas.Container,
                          areas: {
                            title: {
                              blocks: [
                                {
                                  id: 'block:1:title',
                                  blockId: 'title',
                                  type: 'Display',
                                  meta: outputMetas.Display,
                                },
                              ],
                            },
                            content: {
                              blocks: [
                                {
                                  id: 'block:1:textInput',
                                  blockId: 'textInput',
                                  type: 'Input',
                                  meta: outputMetas.Input,
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
                          id: 'block:1:avatar',
                          blockId: 'avatar',
                          type: 'Display',
                          meta: outputMetas.Display,
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

describe('build requests', () => {
  test('requests not an array', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          auth,
          type: 'Context',
          requests: 'requests',
        },
      ],
    };
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Requests is not an array at page_1 on page page_1. Received "requests"'
    );
  });

  test('request id missing', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          auth,
          type: 'Context',
          requests: [{ type: 'Request' }],
        },
      ],
    };
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Request id missing at page "page_1".'
    );
  });

  test('request id not a string', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          auth,
          type: 'Context',
          requests: [{ id: true, type: 'Request' }],
        },
      ],
    };
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Request id is not a string at page "page_1". Received true.'
    );
  });

  test('request id contains a "."', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          auth,
          type: 'Context',
          requests: [{ id: 'my.request', type: 'Request' }],
        },
      ],
    };
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Request id "my.request" should not include a period (".").'
    );
  });

  test('give request an id', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          requests: [
            {
              id: 'request_1',
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          operators: [],
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
              auth: { public: true },
              requestId: 'request_1',
              contextId: 'page_1',
            },
          ],
        },
      ],
    });
  });

  test('request on a context block not at root', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          blocks: [
            {
              id: 'context',
              type: 'Context',
              requests: [
                {
                  id: 'request_1',
                },
              ],
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          operators: [],
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:page_1:context',
                  blockId: 'context',
                  type: 'Context',
                  operators: [],
                  meta: outputMetas.Context,
                  requests: [
                    {
                      id: 'request:page_1:context:request_1',
                      auth: { public: true },
                      requestId: 'request_1',
                      contextId: 'context',
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

  test('request on a non-context block', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          blocks: [
            {
              id: 'box',
              type: 'Container',
              requests: [
                {
                  id: 'request_1',
                },
              ],
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          blockId: 'page_1',
          operators: [],
          pageId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
              auth: { public: true },
              requestId: 'request_1',
              contextId: 'page_1',
            },
          ],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:page_1:box',
                  blockId: 'box',
                  type: 'Container',
                  meta: outputMetas.Container,
                },
              ],
            },
          },
        },
      ],
    });
  });

  test('request on a non-context block below a context block not at root', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          blocks: [
            {
              id: 'context',
              type: 'Context',
              blocks: [
                {
                  id: 'box',
                  type: 'Container',
                  requests: [
                    {
                      id: 'request_1',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          operators: [],
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:page_1:context',
                  blockId: 'context',
                  type: 'Context',
                  operators: [],
                  meta: outputMetas.Context,
                  requests: [
                    {
                      id: 'request:page_1:context:request_1',
                      auth: { public: true },
                      requestId: 'request_1',
                      contextId: 'context',
                    },
                  ],
                  areas: {
                    content: {
                      blocks: [
                        {
                          id: 'block:page_1:box',
                          blockId: 'box',
                          meta: outputMetas.Container,
                          type: 'Container',
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

  test('request on a non-context block below a context block and at root', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          blocks: [
            {
              id: 'context',
              type: 'Context',
              blocks: [
                {
                  id: 'box-inner',
                  type: 'Container',
                },
              ],
            },
            {
              id: 'box',
              type: 'Container',
              requests: [
                {
                  id: 'request_1',
                },
              ],
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          blockId: 'page_1',
          type: 'Context',
          meta: {
            category: 'context',
            loading: { type: 'Spinner' },
            moduleFederation: {
              module: 'Context',
              scope: 'blocks',
              url: 'https://example.com/remoteEntry.js',
            },
          },
          operators: [],
          pageId: 'page_1',
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
              auth: { public: true },
              contextId: 'page_1',
              requestId: 'request_1',
            },
          ],
          areas: {
            content: {
              blocks: [
                {
                  id: 'block:page_1:context',
                  blockId: 'context',
                  operators: [],
                  type: 'Context',
                  requests: [],
                  areas: {
                    content: {
                      blocks: [
                        {
                          blockId: 'box-inner',
                          id: 'block:page_1:box-inner',
                          meta: {
                            category: 'container',
                            loading: {
                              type: 'Spinner',
                            },
                            moduleFederation: {
                              module: 'Container',
                              scope: 'blocks',
                              url: 'https://example.com/remoteEntry.js',
                            },
                          },
                          type: 'Container',
                        },
                      ],
                    },
                  },
                  meta: {
                    category: 'context',
                    loading: { type: 'Spinner' },
                    moduleFederation: {
                      module: 'Context',
                      scope: 'blocks',
                      url: 'https://example.com/remoteEntry.js',
                    },
                  },
                },
                {
                  id: 'block:page_1:box',
                  blockId: 'box',
                  type: 'Container',
                  meta: {
                    category: 'container',
                    loading: { type: 'Spinner' },
                    moduleFederation: {
                      module: 'Container',
                      scope: 'blocks',
                      url: 'https://example.com/remoteEntry.js',
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

  test('multiple requests', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          requests: [
            {
              id: 'request_1',
            },
            {
              id: 'request_2',
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          operators: [],
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
              auth: { public: true },
              requestId: 'request_1',
              contextId: 'page_1',
            },
            {
              id: 'request:page_1:page_1:request_2',
              auth: { public: true },
              requestId: 'request_2',
              contextId: 'page_1',
            },
          ],
        },
      ],
    });
  });
});

test('add user defined loading to meta', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
        auth,
        loading: {
          custom: true,
        },
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            loading: {
              custom: true,
            },
          },
        ],
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        operators: [],
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Context',
        loading: {
          custom: true,
        },
        meta: {
          category: 'context',
          moduleFederation: {
            scope: 'blocks',
            module: 'Context',
            url: 'https://example.com/remoteEntry.js',
          },
          loading: {
            custom: true,
          },
        },
        requests: [],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:block_1',
                blockId: 'block_1',
                type: 'Input',
                loading: {
                  custom: true,
                },
                meta: {
                  category: 'input',
                  moduleFederation: {
                    scope: 'blocks',
                    module: 'Input',
                    url: 'https://example.com/remoteEntry.js',
                  },
                  valueType: 'string',
                  loading: {
                    custom: true,
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

describe('auth field', () => {
  test('set auth to request', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          auth: { public: true },
          type: 'Context',
          requests: [
            {
              id: 'request_1',
            },
          ],
        },
        {
          id: 'page_2',
          type: 'Context',
          auth: { public: false },
          requests: [
            {
              id: 'request_2',
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page_1',
          auth: { public: true },
          operators: [],
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
              auth: { public: true },
              requestId: 'request_1',
              contextId: 'page_1',
            },
          ],
        },
        {
          id: 'page:page_2',
          auth: { public: false },
          operators: [],
          pageId: 'page_2',
          blockId: 'page_2',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_2:page_2:request_2',
              auth: { public: false },
              requestId: 'request_2',
              contextId: 'page_2',
            },
          ],
        },
      ],
    });
  });
});

describe('web operators', () => {
  test('set empty operators array for every context', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          blocks: [
            {
              id: 'context_1',
              type: 'Context',
            },
            {
              id: 'context_2',
              type: 'Context',
              blocks: [
                {
                  id: 'context_2_1',
                  type: 'Context',
                },
                {
                  id: 'block_2_2',
                  type: 'Display',
                },
              ],
            },
            {
              id: 'block_3',
              type: 'Display',
            },
          ],
        },
        {
          id: 'page_2',
          type: 'Context',
          auth,
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(get(res, 'pages.0.operators')).toEqual([]);
    expect(get(res, 'pages.0.areas.content.blocks.0.operators')).toEqual([]);
    expect(get(res, 'pages.0.areas.content.blocks.1.areas.content.blocks.0.operators')).toEqual([]);
    expect(get(res, 'pages.1.operators')).toEqual([]);
  });

  test('set all operators for context', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          properties: {
            a: { _c_op_1: {} },
          },
          blocks: [
            {
              id: 'block_1',
              type: 'Display',
              visible: {
                _v_1: {},
              },
              properties: {
                a: { _op_1: {} },
                b: { _op_1: {} },
                c: { _op_2: { __op_3: { ___op_4: {} } } },
              },
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(get(res, 'pages.0.operators')).toEqual([
      '_c_op_1',
      '_v_1',
      '_op_1',
      '_op_4',
      '_op_3',
      '_op_2',
    ]);
  });

  test('exclude requests operators', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          requests: [
            {
              id: 'request_1',
              properties: {
                a: { _r_op_1: {} },
              },
            },
          ],
          properties: {
            a: { _c_op_1: {} },
          },
          blocks: [
            {
              id: 'block_1',
              type: 'Display',
              visible: {
                _v_1: {},
              },
              properties: {
                a: { _op_1: {} },
                b: { _op_1: {} },
                c: { _op_2: { __op_3: { ___op_4: {} } } },
              },
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(get(res, 'pages.0.operators')).toEqual([
      '_c_op_1',
      '_v_1',
      '_op_1',
      '_op_4',
      '_op_3',
      '_op_2',
    ]);
  });

  test('set operators specific to multiple contexts', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
          auth,
          properties: {
            a: { _c_op_1: {} },
          },
          blocks: [
            {
              id: 'block_1',
              type: 'Context',
              visible: {
                _v_1: {},
              },
              properties: {
                a: { _op_1: {} },
                b: { _op_1: {} },
                c: { _op_2: { __op_3: { ___op_4: {} } } },
              },
            },
          ],
        },
      ],
    };
    const res = await buildPages({ components, context });
    expect(get(res, 'pages.0.operators')).toEqual(['_c_op_1']);
    expect(get(res, 'pages.0.areas.content.blocks.0.operators')).toEqual([
      '_v_1',
      '_op_1',
      '_op_4',
      '_op_3',
      '_op_2',
    ]);
  });
});

test('block events actions array should map to try catch', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
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
  const res = await buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([]);
});

test('block events actions as try catch arrays', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
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
  const res = await buildPages({ components, context });
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.try')).toEqual([
    {
      id: 'action_1',
      type: 'Reset',
    },
  ]);
  expect(get(res, 'pages.0.areas.content.blocks.0.events.onClick.catch')).toEqual([
    {
      id: 'action_1',
      type: 'Retry',
    },
  ]);
});

test('block events actions try not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Events must be an array of actions at block_1 in events onClick on page page_1. Received {"id":"action_1","type":"Reset"}'
  );
});

test('block events actions not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Events must be an array of actions at block_1 in events onClick on page page_1. Received undefined'
  );
});

test('block events actions catch not an array', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Context',
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Catch events must be an array of actions at block_1 in events onClick on page page_1. Received {"id":"action_1","type":"Reset"}'
  );
});
