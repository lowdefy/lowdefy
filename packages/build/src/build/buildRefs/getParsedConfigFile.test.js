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

import { ConfigError } from '@lowdefy/errors';
import { expect, test } from 'vitest';

import testContext from '../../test-utils/testContext.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';
import getParsedConfigFile from './getParsedConfigFile.js';

const yamlContent = `id: page
type: Box
properties:
  title:
    _var: title
blocks:
  - id: one
    type: Title
`;

// What the walker does to a ref's tree: substitutes in place, stamps ~r and
// adds ~ignoreBuildChecks.
function mutateLikeWalker(tree) {
  tree.properties.title = 'Substituted';
  tree.blocks.push({ id: 'added' });
  setNonEnumerableProperty(tree, '~r', 'ref-1');
  setNonEnumerableProperty(tree.blocks, '~r', 'ref-1');
  tree['~ignoreBuildChecks'] = true;
}

test('getParsedConfigFile parses a YAML file once and gives each caller its own copy', async () => {
  const context = testContext();
  const refDef = { path: 'pages/page.yaml' };

  const first = await getParsedConfigFile({ context, content: yamlContent, refDef });
  const cached = context.parsedConfigCache.get('pages/page.yaml').parsed;
  const second = await getParsedConfigFile({ context, content: yamlContent, refDef });

  expect(context.parsedConfigCache.get('pages/page.yaml').parsed).toBe(cached);
  expect(first).not.toBe(cached);
  expect(second).not.toBe(cached);
  expect(second).not.toBe(first);
  expect(second).toEqual(first);
});

test('getParsedConfigFile copies are independent of each other and of the cached tree', async () => {
  const context = testContext();
  const refDef = { path: 'pages/page.yaml' };

  const first = await getParsedConfigFile({ context, content: yamlContent, refDef });
  mutateLikeWalker(first);
  const second = await getParsedConfigFile({ context, content: yamlContent, refDef });
  const cached = context.parsedConfigCache.get('pages/page.yaml').parsed;

  for (const tree of [second, cached]) {
    expect(tree.properties.title).toEqual({ _var: 'title' });
    expect(tree.blocks).toHaveLength(1);
    expect(tree['~r']).toBeUndefined();
    expect(tree.blocks['~r']).toBeUndefined();
    expect(tree['~ignoreBuildChecks']).toBeUndefined();
  }
});

test('getParsedConfigFile copies of a JSON file are independent of each other', async () => {
  const context = testContext();
  const refDef = { path: 'data/list.json' };
  const content = '{"items": [{"id": "a"}], "nested": {"value": 1}}';

  const first = await getParsedConfigFile({ context, content, refDef });
  first.items[0].id = 'changed';
  first.nested.value = 2;
  const second = await getParsedConfigFile({ context, content, refDef });

  expect(second).toEqual({ items: [{ id: 'a' }], nested: { value: 1 } });
  expect(context.parsedConfigCache.get('data/list.json').parsed).toEqual(second);
});

test('getParsedConfigFile keeps ~l line numbers on objects and arrays in each copy', async () => {
  const context = testContext();
  const refDef = { path: 'pages/page.yaml' };

  await getParsedConfigFile({ context, content: yamlContent, refDef });
  const copy = await getParsedConfigFile({ context, content: yamlContent, refDef });

  expect(copy['~l']).toBe(1);
  expect(copy.properties['~l']).toBe(3);
  expect(copy.blocks['~l']).toBe(6);
  expect(copy.blocks[0]['~l']).toBe(7);
  expect(Object.keys(copy)).toEqual(['id', 'type', 'properties', 'blocks']);
});

test('getParsedConfigFile keeps ~r, ~k and ~arr markers on a copy', async () => {
  const context = testContext();
  const content = 'list:\n  - a\n';
  const refDef = { path: 'list.yaml' };
  await getParsedConfigFile({ context, content, refDef });
  const cached = context.parsedConfigCache.get('list.yaml').parsed;
  setNonEnumerableProperty(cached, '~r', 'ref-1');
  setNonEnumerableProperty(cached, '~k', 'key-1');
  setNonEnumerableProperty(cached.list, '~arr', 'arr-1');

  const copy = await getParsedConfigFile({ context, content, refDef });

  expect(copy['~r']).toBe('ref-1');
  expect(copy['~k']).toBe('key-1');
  expect(copy.list['~arr']).toBe('arr-1');
  expect(Object.keys(copy)).toEqual(['list']);
});

test('getParsedConfigFile parses again when the same path has different content', async () => {
  const context = testContext();
  const refDef = { path: 'pages/page.yaml' };

  await getParsedConfigFile({ context, content: 'title: Old\n', refDef });
  const edited = await getParsedConfigFile({ context, content: 'title: New\n', refDef });

  expect(edited).toEqual({ title: 'New' });
  expect(context.parsedConfigCache.get('pages/page.yaml')).toEqual({
    content: 'title: New\n',
    parsed: { title: 'New' },
  });
});

test('getParsedConfigFile throws the YAML parse error at every ref and caches nothing', async () => {
  const context = testContext();
  const refDef = { path: 'broken.yaml' };
  const content = 'key: [unclosed\n';

  for (let i = 0; i < 2; i += 1) {
    const error = await getParsedConfigFile({ context, content, refDef }).catch((e) => e);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toMatch('YAML parse error in "broken.yaml".');
  }
  expect(context.parsedConfigCache.has('broken.yaml')).toBe(false);
});

test('getParsedConfigFile throws the reserved ~deferred key error at every ref and caches nothing', async () => {
  const context = testContext();
  const refDef = { path: 'reserved.yaml' };
  const content = 'block:\n  "~deferred": anything\n';

  for (let i = 0; i < 2; i += 1) {
    const error = await getParsedConfigFile({ context, content, refDef }).catch((e) => e);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toMatch('The key "~deferred" is reserved by the Lowdefy build');
  }
  expect(context.parsedConfigCache.has('reserved.yaml')).toBe(false);
});

test('getParsedConfigFile returns null for an empty YAML file and a scalar for a scalar file', async () => {
  const context = testContext();

  for (let i = 0; i < 2; i += 1) {
    expect(
      await getParsedConfigFile({ context, content: '', refDef: { path: 'empty.yaml' } })
    ).toBe(null);
    expect(
      await getParsedConfigFile({ context, content: 'Hello\n', refDef: { path: 'scalar.yaml' } })
    ).toBe('Hello');
    expect(await getParsedConfigFile({ context, content: '42', refDef: { path: 'n.json' } })).toBe(
      42
    );
  }
});
