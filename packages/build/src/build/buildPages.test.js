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

import buildPages from './buildPages';
import testContext from '../test/testContext';

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

const mockMetaLoader = (type) => {
  const meta = blockMetas[type];
  if (!meta) {
    return null;
  }
  return Promise.resolve(meta);
};

const metaLoader = {
  load: mockMetaLoader,
};

const context = testContext({ logger, metaLoader });

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
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow('Page id missing at page 0');
});

test('block does not have an id', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Context',
        blocks: [
          {
            type: 'Input',
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block id missing at page page1'
  );
});

test('page type missing', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
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
      },
    ],
  };
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:1',
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
          blockId: 'page1',
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
          blockId: '1',
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
          pageId: '1',
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
          type: 'Context',
          requests: 'requests',
        },
      ],
    };
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Requests is not an array at page_1 on page page_1. Received "requests"'
    );
  });

  test('give request an id', async () => {
    const components = {
      pages: [
        {
          id: 'page_1',
          type: 'Context',
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
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
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
                  meta: outputMetas.Context,
                  requests: [
                    {
                      id: 'request:page_1:context:request_1',
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
          blockId: 'page_1',
          pageId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
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
                  meta: outputMetas.Context,
                  requests: [
                    {
                      id: 'request:page_1:context:request_1',
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
          pageId: 'page_1',
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
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
          pageId: 'page_1',
          blockId: 'page_1',
          type: 'Context',
          meta: outputMetas.Context,
          requests: [
            {
              id: 'request:page_1:page_1:request_1',
              requestId: 'request_1',
              contextId: 'page_1',
            },
            {
              id: 'request:page_1:page_1:request_2',
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
