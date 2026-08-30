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

import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors';

import addKeys from '../../addKeys.js';
import buildPages from '../../full/buildPages.js';
import testContext from '../../../test-utils/testContext.js';

const auth = { public: true };

const blockSchemas = {
  Button: {
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string' },
          disabled: { type: 'boolean' },
          icon: {
            type: 'object',
            additionalProperties: false,
            properties: { name: { type: 'string' }, spin: { type: 'boolean' } },
          },
        },
      },
    },
  },
  NumberInput: {
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          min: { type: 'number' },
          max: { type: 'number' },
          inputStyle: { type: 'object' },
          options: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, properties: { a: {} } },
          },
        },
      },
    },
  },
  Loose: {
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [`propertyNumber${i}`, { type: 'string' }])
        ),
      },
    },
  },
};

function createContext() {
  const context = testContext();
  context.blockSchemas = blockSchemas;
  return context;
}

function componentsWithBlock(block) {
  return {
    pages: [{ id: 'page_1', type: 'Container', auth, blocks: [block] }],
  };
}

test('validateBlockProperties throws on an unknown property and suggests the nearest name', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { titel: 'Save' },
  });
  expect(() => buildPages({ components, context })).toThrow(
    'Block "submit" of type "Button": unknown property "titel". Did you mean "title"?'
  );
});

test('validateBlockProperties lists the valid properties when no near match exists', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { somethingElseEntirely: true },
  });
  expect(() => buildPages({ components, context })).toThrow(
    'Block "submit" of type "Button": unknown property "somethingElseEntirely". Valid properties: title, disabled, icon.'
  );
});

test('validateBlockProperties omits the property list when the schema has more than ten properties', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'loose',
    type: 'Loose',
    properties: { somethingElseEntirely: true },
  });
  expect(() => buildPages({ components, context })).toThrow(
    'Block "loose" of type "Loose": unknown property "somethingElseEntirely".'
  );
  expect(() => buildPages({ components, context })).not.toThrow('Valid properties');
});

test('validateBlockProperties throws on a wrong type and reports the received value', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'qty',
    type: 'NumberInput',
    properties: { min: '0' },
  });
  expect(() => buildPages({ components, context })).toThrow(
    'Block "qty" of type "NumberInput": properties.min must be number. Received "0".'
  );
});

test('validateBlockProperties reports every error on its own line', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'qty',
    type: 'NumberInput',
    properties: { min: '0', mx: 10 },
  });
  let error;
  try {
    buildPages({ components, context });
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message.split('\n')).toEqual([
    'Block "qty" of type "NumberInput": unknown property "mx". Did you mean "max"?',
    'Block "qty" of type "NumberInput": properties.min must be number. Received "0".',
  ]);
  expect(error.checkSlug).toEqual('block-properties');
  expect(error.received).toEqual({ min: '0', mx: 10 });
});

test('validateBlockProperties names the nested path for a nested unknown property', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { title: 'Save', icon: { nme: 'AiOutlineSave' } },
  });
  expect(() => buildPages({ components, context })).toThrow(
    'Block "submit" of type "Button": properties.icon: unknown property "nme". Did you mean "name"?'
  );
});

test('validateBlockProperties passes when an operator supplies a required field', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { title: { _state: 'title' } },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties passes when the required field is missing entirely', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { disabled: true },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties passes when properties is itself an operator', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { _ref: 'props.yaml' },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties passes with an operator nested three levels deep', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'qty',
    type: 'NumberInput',
    properties: {
      options: [{ a: { deep: { _get: { key: 'x', from: { _state: true } } } } }],
    },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties drops operator array elements instead of leaving holes', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'qty',
    type: 'NumberInput',
    properties: { options: [{ _state: 'first' }, { a: 1 }, { '_array.map': {} }] },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties still fails a literal error beside an operator', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'qty',
    type: 'NumberInput',
    properties: { min: { _state: 'min' }, max: 'ten' },
  });
  expect(() => buildPages({ components, context })).toThrow(
    'Block "qty" of type "NumberInput": properties.max must be number. Received "ten".'
  );
});

test('validateBlockProperties skips a type with no schema', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'custom',
    type: 'CustomBlock',
    properties: { anything: 'goes' },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties skips when no block schemas were loaded', () => {
  const context = testContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { titel: 'Save' },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties does not report style as unknown after normalizeClassAndStyles moves it', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { title: 'Save', style: { color: 'red' } },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties ignores ~-prefixed build metadata keys', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { title: 'Save', '~r': 'ref_1', icon: { name: 'x', '~l': 12 } },
  });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties error is suppressed by ~ignoreBuildChecks block-properties on the block', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    '~ignoreBuildChecks': ['block-properties'],
    properties: { titel: 'Save' },
  });
  addKeys({ components, context });
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('validateBlockProperties error carries the block configKey', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    properties: { titel: 'Save' },
  });
  addKeys({ components, context });
  const blockKey = components.pages[0].blocks[0]['~k'];
  let error;
  try {
    buildPages({ components, context });
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ConfigError);
  expect(blockKey).toBeDefined();
  expect(error.configKey).toEqual(blockKey);
});

test('validateBlockProperties error is not suppressed by an unrelated check slug', () => {
  const context = createContext();
  const components = componentsWithBlock({
    id: 'submit',
    type: 'Button',
    '~ignoreBuildChecks': ['types'],
    properties: { titel: 'Save' },
  });
  addKeys({ components, context });
  expect(() => buildPages({ components, context })).toThrow('unknown property "titel"');
});

test('validateBlockProperties compiles each block type validator once per context', () => {
  const context = createContext();
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          { id: 'a', type: 'Button', properties: { title: 'A' } },
          { id: 'b', type: 'Button', properties: { title: 'B' } },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(Object.keys(context.blockPropertiesValidators)).toEqual(['Button']);
  expect(context.blockPropertiesValidators.Button.schema.required).toBeUndefined();
  expect(blockSchemas.Button.properties.properties.required).toEqual(['title']);
});
