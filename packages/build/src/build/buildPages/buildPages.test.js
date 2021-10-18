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
import testContext from '../../test/testContext';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const blockMetas = {
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
        type: 'Container',
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
        type: 'Container',
        auth,
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Page id is not a string at page 0. Received true.'
  );
});

test('Throw on duplicate page ids', async () => {
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
  await expect(buildPages({ components, context })).rejects.toThrow('Duplicate pageId "page_1".');
});

test('block does not have an id', async () => {
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block id missing at page "page1".'
  );
});

test('block id is not a string', async () => {
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block id is not a string at page "page1". Received true.'
  );
});

test('Throw on duplicate block ids', async () => {
  const components = {
    pages: [
      {
        id: 'one',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'two',
            type: 'Container',
            blocks: [
              {
                id: 'three',
                type: 'Container',
                blocks: [
                  {
                    id: 'one',
                    type: 'Input',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Duplicate blockId "one" on page "one."'
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
    'Block type is not defined at "page1" on page "page1".'
  );
});

test('block type missing', async () => {
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block type is not defined at "blockId" on page "page1".'
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
    'Invalid block type at "page1" on page "page1". Received "NotABlock".'
  );
});

test('invalid block type', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        type: 'Container',
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
    'Invalid block type at "blockId" on page "page1". Received "NotABlock".'
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
    'Block type is not a string at "page1" on page "page1". Received 1.'
  );
});

test('block type not a string', async () => {
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
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Block type is not a string at "blockId" on page "page1". Received 1.'
  );
});

test('no blocks on page', async () => {
  const components = {
    pages: [
      {
        id: '1',
        type: 'Container',
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
        type: 'Container',
        meta: outputMetas.Container,
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
        type: 'Container',
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
        type: 'Container',
        blocks: ['block_1'],
      },
    ],
  };
  await expect(buildPages({ components, context })).rejects.toThrow(
    'Expected block to be an object on page "page1". Received "block_1".'
  );
});

test('block meta should include all meta fields', async () => {
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
        type: 'Container',
        meta: outputMetas.Container,
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
  const res = await buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        operators: [],
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        meta: outputMetas.Container,
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
    await expect(buildPages({ components, context })).rejects.toThrow(
      'Expected blocks to be an array at page1 in area content on page page1. Received "string"'
    );
  });

  test('Add array if area blocks is undefined', async () => {
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:page1',
          auth: { public: true },
          blockId: 'page1',
          operators: [],
          pageId: 'page1',
          type: 'Container',
          meta: outputMetas.Container,
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          blockId: '1',
          operators: [],
          pageId: '1',
          type: 'Container',
          meta: outputMetas.Container,
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          pageId: '1',
          operators: [],
          blockId: '1',
          type: 'Container',
          meta: outputMetas.Container,
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Container',
          meta: outputMetas.Container,
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Container',
          meta: outputMetas.Container,
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Container',
          meta: outputMetas.Container,
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
    const res = await buildPages({ components, context });
    expect(res).toEqual({
      pages: [
        {
          id: 'page:1',
          auth: { public: true },
          operators: [],
          pageId: '1',
          blockId: '1',
          type: 'Container',
          meta: outputMetas.Container,
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

test('add user defined loading to meta', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
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
        type: 'Container',
        loading: {
          custom: true,
        },
        meta: {
          category: 'container',
          moduleFederation: {
            scope: 'blocks',
            module: 'Container',
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
