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

import { afterAll, beforeAll, expect, test, vi } from 'vitest';

import testContext from '../../test-utils/testContext.js';
import buildAppMeta from '../buildAppMeta.js';
import buildRefs from './buildRefs.js';
import getRefContent from './getRefContent.js';

function createContext(files) {
  const readConfigFile = vi.fn(async (filePath) => files[filePath] ?? null);
  const context = testContext({ readConfigFile });
  context.errors = [];
  context.unresolvedRefVars = {};
  return context;
}

const originalGitSha = process.env.LOWDEFY_GIT_SHA;
beforeAll(() => {
  process.env.LOWDEFY_GIT_SHA = 'test-sha';
});
afterAll(() => {
  if (originalGitSha === undefined) {
    delete process.env.LOWDEFY_GIT_SHA;
  } else {
    process.env.LOWDEFY_GIT_SHA = originalGitSha;
  }
});

test('getRefContent reads the file for every ref and parses it once', async () => {
  const context = createContext({ 'shared.yaml': 'id: shared\n' });
  const refDef = { path: 'shared.yaml' };

  const first = await getRefContent({ context, refDef, referencedFrom: 'a.yaml' });
  const cached = context.parsedConfigCache.get('shared.yaml').parsed;
  const second = await getRefContent({ context, refDef, referencedFrom: 'b.yaml' });

  // Every read reaches readConfigFile, which the dev server records per page.
  expect(context.readConfigFile).toHaveBeenCalledTimes(2);
  expect(context.parsedConfigCache.get('shared.yaml').parsed).toBe(cached);
  expect(first).toEqual({ id: 'shared' });
  expect(second).toEqual({ id: 'shared' });
  expect(second).not.toBe(first);
});

test('getRefContent parses lowdefy.yaml once for buildAppMeta and buildRefs', async () => {
  const context = createContext({ 'lowdefy.yaml': 'name: My app\nfield: value\n' });

  await buildAppMeta({ context });
  const cached = context.parsedConfigCache.get('lowdefy.yaml').parsed;
  const components = await buildRefs({ context });

  expect(context.appMeta.name).toBe('My app');
  expect(components).toEqual({ name: 'My app', field: 'value' });
  expect(context.parsedConfigCache.get('lowdefy.yaml').parsed).toBe(cached);
  expect(context.readConfigFile).toHaveBeenCalledTimes(2);
});

test('getRefContent renders a .njk file for each ref with its own vars and caches nothing', async () => {
  const context = createContext({ 'template.yaml.njk': 'title: {{ title }}\n' });

  const first = await getRefContent({
    context,
    refDef: { path: 'template.yaml.njk', vars: { title: 'First' } },
  });
  const second = await getRefContent({
    context,
    refDef: { path: 'template.yaml.njk', vars: { title: 'Second' } },
  });

  expect(first).toEqual({ title: 'First' });
  expect(second).toEqual({ title: 'Second' });
  expect(context.parsedConfigCache.size).toBe(0);
});

test('getRefContent runs a per-ref resolver for every ref and caches nothing', async () => {
  const context = createContext({});
  let calls = 0;
  const resolver = vi.fn(async () => {
    calls += 1;
    return `count: ${calls}\n`;
  });
  context.importAppCode = vi.fn(async () => resolver);
  const refDef = { path: 'resolved.yaml', resolver: 'resolver.js' };

  const first = await getRefContent({ context, refDef });
  const second = await getRefContent({ context, refDef });

  expect(first).toEqual({ count: 1 });
  expect(second).toEqual({ count: 2 });
  expect(resolver).toHaveBeenCalledTimes(2);
  expect(context.readConfigFile).not.toHaveBeenCalled();
  expect(context.parsedConfigCache.size).toBe(0);
});

test('getRefContent runs the app ref resolver for every ref and caches nothing', async () => {
  const context = createContext({});
  let calls = 0;
  const resolver = vi.fn(async () => {
    calls += 1;
    return `count: ${calls}\n`;
  });
  context.importAppCode = vi.fn(async () => resolver);
  context.refResolver = 'resolver.js';
  const refDef = { path: 'resolved.yaml' };

  const first = await getRefContent({ context, refDef });
  const second = await getRefContent({ context, refDef });

  expect(first).toEqual({ count: 1 });
  expect(second).toEqual({ count: 2 });
  expect(context.parsedConfigCache.size).toBe(0);
});

test('buildRefs gives two refs to one file with different vars independent trees', async () => {
  const context = createContext({
    'lowdefy.yaml': `
first:
  _ref:
    path: shared.yaml
    vars:
      title: First
second:
  _ref:
    path: shared.yaml
    vars:
      title: Second
data:
  - _ref: data.json
  - _ref: data.json
`,
    'shared.yaml': 'title:\n  _var: title\nitems:\n  - id: a\n',
    'data.json': '{"value": {"_var": {"key": "missing", "default": "default"}}}',
  });

  const components = await buildRefs({ context });

  expect(context.errors).toEqual([]);
  expect(components.first).toEqual({ title: 'First', items: [{ id: 'a' }] });
  expect(components.second).toEqual({ title: 'Second', items: [{ id: 'a' }] });
  expect(components.first['~r']).not.toBe(components.second['~r']);
  expect(components.data).toEqual([{ value: 'default' }, { value: 'default' }]);
  expect(context.parsedConfigCache.get('shared.yaml').parsed).toEqual({
    title: { _var: 'title' },
    items: [{ id: 'a' }],
  });
  expect(context.parsedConfigCache.get('shared.yaml').parsed['~r']).toBeUndefined();
});

test('buildRefs reports the reserved ~deferred key at every ref to the file', async () => {
  const context = createContext({
    'lowdefy.yaml': 'first:\n  _ref: reserved.yaml\nsecond:\n  _ref: reserved.yaml\n',
    'reserved.yaml': 'block:\n  "~deferred": anything\n',
  });

  await buildRefs({ context });

  expect(context.errors).toHaveLength(2);
  for (const error of context.errors) {
    expect(error.name).toBe('ConfigError');
    expect(error.message).toMatch('The key "~deferred" is reserved by the Lowdefy build');
  }
});

test('buildRefs reports a YAML parse error at every ref to the file', async () => {
  const context = createContext({
    'lowdefy.yaml': 'first:\n  _ref: broken.yaml\nsecond:\n  _ref: broken.yaml\n',
    'broken.yaml': 'key: [unclosed\n',
  });

  await buildRefs({ context });

  expect(context.errors).toHaveLength(2);
  for (const error of context.errors) {
    expect(error.name).toBe('ConfigError');
    expect(error.message).toMatch('YAML parse error in "broken.yaml".');
  }
});
