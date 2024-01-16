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

test('global incorrect type', async () => {
  const components = {
    global: 'global',
  };
  const error = {
    instancePath: '/global',
    message: 'should be object',
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`Schema Error
should be object
- global`);
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
  expect(res).toEqual(`Schema Error
should have required property 'id'
- pages
 - [0:_ERROR_MISSING_ID_:PageHeaderMenu]`);
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
  expect(res).toEqual(`Schema Error
should have required property 'type'
- pages
 - [0:page1:_ERROR_MISSING_TYPE_]`);
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
  expect(res).toEqual(`Schema Error
should be string
- pages
 - [0:1:_ERROR_MISSING_TYPE_].id`);
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
  };
  const res = formatErrorMessage({ error, components });
  expect(res).toEqual(`Schema Error
must NOT have additional properties
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
  expect(res).toEqual(`Schema Error
Block should be an object.
- pages
 - [0:page_1:Box].blocks
  - [0]`);
});
