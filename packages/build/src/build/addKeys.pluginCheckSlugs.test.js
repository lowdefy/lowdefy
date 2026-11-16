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

import addKeys from './addKeys.js';
import testContext from '../test-utils/testContext.js';
import { expect, test } from 'vitest';

function runAddKeys(ignoreBuildChecks) {
  const context = testContext();
  context.errors = [];
  const components = {
    pages: [{ id: 'home', type: 'Box', '~ignoreBuildChecks': ignoreBuildChecks }],
  };
  addKeys({ components, context });
  return { components, context };
}

test('addKeys accepts plugin-checks and records nothing for it', () => {
  const { components, context } = runAddKeys(['plugin-checks']);
  expect(context.errors).toEqual([]);
  expect(context.pluginCheckSlugRefs.size).toBe(0);
  expect(context.keyMap[components.pages[0]['~k']].i).toEqual([
    'plugin-checks',
  ]);
});

test('addKeys accepts built-in slugs and records nothing for them', () => {
  const { context } = runAddKeys(['state-refs', 'types']);
  expect(context.errors).toEqual([]);
  expect(context.pluginCheckSlugRefs.size).toBe(0);
});

test('addKeys accepts a kebab-case plugin slug and records the node that lists it', () => {
  const { components, context } = runAddKeys(['some-future-rule']);
  expect(context.errors).toEqual([]);
  expect(context.pluginCheckSlugRefs).toEqual(
    new Map([['some-future-rule', [components.pages[0]['~k']]]])
  );
});

test('addKeys records each node that lists a plugin slug', () => {
  const context = testContext();
  context.errors = [];
  const components = {
    pages: [
      { id: 'a', type: 'Box', '~ignoreBuildChecks': ['if-test'] },
      { id: 'b', type: 'Box', '~ignoreBuildChecks': ['if-test', 'state-refs'] },
    ],
  };
  addKeys({ components, context });
  expect(context.pluginCheckSlugRefs.get('if-test')).toEqual([
    components.pages[0]['~k'],
    components.pages[1]['~k'],
  ]);
});

test('addKeys run again over the same tree does not duplicate recorded nodes', () => {
  const { components, context } = runAddKeys(['if-test']);
  components.pages.push({ id: 'new', type: 'Box' });
  addKeys({ components, context });
  addKeys({ components, context });
  expect(context.pluginCheckSlugRefs.get('if-test')).toEqual([components.pages[0]['~k']]);
});

test('addKeys rejects a slug that is not kebab-case and does not record it', () => {
  const { context } = runAddKeys(['Not_Kebab', 'if-test']);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('Invalid check slug(s): "Not_Kebab".');
  expect(context.pluginCheckSlugRefs.has('Not_Kebab')).toBe(false);
  expect(context.pluginCheckSlugRefs.has('if-test')).toBe(true);
});

test('addKeys rejects slugs with leading, trailing or doubled dashes', () => {
  const { context } = runAddKeys(['-rule', 'rule-', 'a--b']);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('"-rule", "rule-", "a--b"');
  expect(context.pluginCheckSlugRefs.size).toBe(0);
});

test('addKeys rejects a slug that is not a string', () => {
  const { context } = runAddKeys([42]);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('Invalid check slug(s)');
});

test('addKeys still rejects a value that is neither true nor an array', () => {
  const { context } = runAddKeys('if-test');
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '~ignoreBuildChecks must be true or an array of check slugs.'
  );
  expect(context.pluginCheckSlugRefs.size).toBe(0);
});
