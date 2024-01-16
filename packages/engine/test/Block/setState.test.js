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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId, _internal: {} };

test('Update block value using SetState', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'setState',
              type: 'SetState',
              params: { textInput: 'efg' },
            },
          ],
        },
      },
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { button, textInput } = context._internal.RootBlocks.map;

  textInput.setValue('abc');
  expect(textInput.value).toBe('abc');
  await button.triggerEvent({ name: 'onClick' });
  expect(textInput.value).toBe('efg');
  expect(context.state).toEqual({ textInput: 'efg' });
});

test('Set block value to null using set state', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'setState',
              type: 'SetState',
              params: { textInput: null },
            },
          ],
        },
      },
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { button, textInput } = context._internal.RootBlocks.map;

  textInput.setValue('abc');
  expect(textInput.value).toBe('abc');
  await button.triggerEvent({ name: 'onClick' });
  expect(textInput.value).toBe(null);
  expect(context.state).toEqual({ textInput: null });
});

test('Set nested block value to null using set state', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'setState',
              type: 'SetState',
              params: { nested: null },
            },
          ],
        },
      },
      {
        id: 'nested.textInput',
        type: 'TextInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { button } = context._internal.RootBlocks.map;
  const textInput = context._internal.RootBlocks.map['nested.textInput'];

  textInput.setValue('abc');
  expect(textInput.value).toBe('abc');
  expect(context.state).toEqual({ nested: { textInput: 'abc' } });
  await button.triggerEvent({ name: 'onClick' });
  expect(textInput.value).toBe(null);
  expect(context.state).toEqual({ nested: { textInput: null } });
});

test('Set nested block value to null using set state applies default value', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'setState',
              type: 'SetState',
              params: { nested: null },
            },
          ],
        },
      },
      {
        id: 'nested.selector',
        type: 'MultipleSelector',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { button } = context._internal.RootBlocks.map;
  const selector = context._internal.RootBlocks.map['nested.selector'];

  selector.setValue(['abc']);
  expect(selector.value).toEqual(['abc']);
  await button.triggerEvent({ name: 'onClick' });
  expect(selector.value).toEqual([]);
  expect(context.state).toEqual({ nested: { selector: [] } });
});

test('Set block id to null explicitly does not apply default null value ', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'setState',
              type: 'SetState',
              params: { selector: null },
            },
          ],
        },
      },
      {
        id: 'selector',
        type: 'MultipleSelector',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { button, selector } = context._internal.RootBlocks.map;

  selector.setValue(['abc']);
  expect(selector.value).toEqual(['abc']);
  await button.triggerEvent({ name: 'onClick' });
  expect(selector.value).toEqual(null);
  expect(context.state).toEqual({ selector: null });
});
