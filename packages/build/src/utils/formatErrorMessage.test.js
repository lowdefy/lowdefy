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

import formatErrorMessage from './formatErrorMessage.js';

const mockContext = {
  refMap: {
    ref1: { path: 'pages/home.yaml' },
  },
  directories: {
    config: '/Users/dev/myapp',
  },
};

test('global incorrect type', async () => {
  const components = {
    global: 'global',
  };
  const error = {
    instancePath: '/global',
    message: 'should be object',
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] should be object
  lowdefy.yaml at root.global
  `);
});

test('page id missing', async () => {
  const components = {
    pages: [
      {
        type: 'PageHeaderMenu',
        blocks: [
          {
            id: 'b1',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0',
    message: "should have required property 'id'",
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] should have required property 'id'
  lowdefy.yaml at root.pages[0:PageHeaderMenu]
  `);
});

test('page type missing', async () => {
  const components = {
    pages: [
      {
        id: 'page1',
        blocks: [],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0',
    message: "should have required property 'type'",
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] should have required property 'type'
  lowdefy.yaml at root.pages[0:page1]
  `);
});

test('id incorrect type', async () => {
  const components = {
    pages: [
      {
        id: 1,
        blocks: [],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0/id',
    message: 'should be string',
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] should be string
  lowdefy.yaml at root.pages[0].id
  `);
});

test('Additional properties as root config.', async () => {
  const components = {
    additional: true,
    pages: [
      {
        id: 'page_1',
        blocks: [],
      },
    ],
  };
  const error = {
    instancePath: '',
    message: 'must NOT have additional properties',
    params: { additionalProperty: 'additional' },
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] must NOT have additional properties - "additional"
  lowdefy.yaml at root
  `);
});

test('Block is null.', async () => {
  const components = {
    additional: true,
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        blocks: [null],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0/blocks/0',
    message: 'Block should be an object.',
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] Block should be an object.
  lowdefy.yaml at root.pages[0:page_1:Box].blocks[0]
  `);
});

test('with ref location info', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        '~r': 'ref1',
        '~l': 5,
        blocks: [
          {
            id: 'block_1',
            type: 'TextInput',
          },
        ],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0/blocks/0',
    message: 'Block "style" should be an object.',
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] Block "style" should be an object.
  pages/home.yaml:5 at root.pages[0:page_1:Box].blocks[0:block_1:TextInput]
  /Users/dev/myapp/pages/home.yaml:5`);
});

test('with ref location info no line number', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        '~r': 'ref1',
        blocks: [],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0',
    message: 'Block missing required field.',
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] Block missing required field.
  pages/home.yaml at root.pages[0:page_1:Box]
  /Users/dev/myapp/pages/home.yaml`);
});

test('nested block error with rich path', async () => {
  const components = {
    pages: [
      {
        id: 'home',
        type: 'Box',
        blocks: [
          {
            id: 'container',
            type: 'Box',
            blocks: [
              {
                id: 'button',
                type: 'Button',
              },
            ],
          },
        ],
      },
    ],
  };
  const error = {
    instancePath: '/pages/0/blocks/0/blocks/0',
    message: 'Block "events" should be an object.',
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`[Config Schema Error] Block "events" should be an object.
  lowdefy.yaml at root.pages[0:home:Box].blocks[0:container:Box].blocks[0:button:Button]
  `);
});

test('with context includes full path', async () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
      },
    ],
  };
  const error = {
    instancePath: '/pages/0',
    message: 'Block missing blocks.',
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] Block missing blocks.
  lowdefy.yaml at root.pages[0:page_1:Box]
  /Users/dev/myapp/lowdefy.yaml`);
});

test('with line number but no ref (root file content)', async () => {
  const components = {
    '~l': 1,
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        '~l': 5,
      },
    ],
  };
  const error = {
    instancePath: '/pages/0',
    message: 'Block missing blocks.',
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] Block missing blocks.
  lowdefy.yaml:5 at root.pages[0:page_1:Box]
  /Users/dev/myapp/lowdefy.yaml:5`);
});

test('additional property at root with line number', async () => {
  const components = {
    '~l': 1,
    lowdefy: '4.0.0',
    requests: {
      '~l': 10,
    },
    pages: [],
  };
  const error = {
    instancePath: '',
    message: 'must NOT have additional properties',
    params: { additionalProperty: 'requests' },
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] must NOT have additional properties - "requests"
  lowdefy.yaml:10 at root
  /Users/dev/myapp/lowdefy.yaml:10`);
});

test('root level error with line number', async () => {
  const components = {
    '~l': 1,
    lowdefy: '4.0.0',
  };
  const error = {
    instancePath: '',
    message: "should have required property 'pages'",
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] should have required property 'pages'
  lowdefy.yaml:1 at root
  /Users/dev/myapp/lowdefy.yaml:1`);
});

test('additional property array at root with line number', async () => {
  const requests = [{ id: 'req1' }];
  requests['~l'] = 15;
  const components = {
    '~l': 1,
    lowdefy: '4.0.0',
    requests,
    pages: [],
  };
  const error = {
    instancePath: '',
    message: 'must NOT have additional properties',
    params: { additionalProperty: 'requests' },
  };
  const res = formatErrorMessage({ error, components, context: mockContext });
  expect(res).toEqual(`[Config Schema Error] must NOT have additional properties - "requests"
  lowdefy.yaml:15 at root
  /Users/dev/myapp/lowdefy.yaml:15`);
});
