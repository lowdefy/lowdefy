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

import shouldSuppressBuildCheck, {
  PLUGIN_CHECKS_SLUG,
  VALID_CHECK_SLUGS,
} from './shouldSuppressBuildCheck.js';
import { expect, test } from 'vitest';

const pluginError = {
  configKey: 'child',
  checkSlug: 'if-test',
  checkGroup: PLUGIN_CHECKS_SLUG,
};

function keyMapWith(ignored) {
  return {
    parent: { key: 'pages.0', '~ignoreBuildChecks': ignored },
    child: { key: 'pages.0.blocks.0', '~k_parent': 'parent' },
  };
}

test('PLUGIN_CHECKS_SLUG is plugin-checks and not a built-in slug', () => {
  expect(PLUGIN_CHECKS_SLUG).toBe('plugin-checks');
  expect(VALID_CHECK_SLUGS[PLUGIN_CHECKS_SLUG]).toBeUndefined();
});

test('plugin-checks on an ancestor suppresses an error with that checkGroup', () => {
  expect(shouldSuppressBuildCheck(pluginError, keyMapWith(['plugin-checks']))).toBe(true);
});

test('plugin-checks suppresses any rule slug in the group', () => {
  const error = { ...pluginError, checkSlug: 'some-other-rule' };
  expect(shouldSuppressBuildCheck(error, keyMapWith(['plugin-checks']))).toBe(true);
});

test('plugin-checks does not suppress a built-in check without the group', () => {
  const error = { configKey: 'child', checkSlug: 'state-refs' };
  expect(shouldSuppressBuildCheck(error, keyMapWith(['plugin-checks']))).toBe(false);
});

test('a rule slug suppresses an error with that checkSlug', () => {
  expect(shouldSuppressBuildCheck(pluginError, keyMapWith(['if-test']))).toBe(true);
});

test('a rule slug does not suppress an error with another checkSlug', () => {
  const error = { ...pluginError, checkSlug: 'switch-branches' };
  expect(shouldSuppressBuildCheck(error, keyMapWith(['if-test']))).toBe(false);
});

test('true suppresses plugin rule errors', () => {
  expect(shouldSuppressBuildCheck(pluginError, keyMapWith(true))).toBe(true);
});

test('a group slug on the node itself suppresses its errors', () => {
  const keyMap = { child: { key: 'pages.0', '~ignoreBuildChecks': ['plugin-checks'] } };
  expect(shouldSuppressBuildCheck(pluginError, keyMap)).toBe(true);
});

// The same chain, three deep, with the ignore value on the grandparent, in
// each key map entry shape.
const grandparentKeyMaps = [
  [
    'full',
    (ignored) => ({
      grandparent: { key: 'root.pages[0:home]', '~ignoreBuildChecks': ignored },
      parent: { key: 'root.pages[0:home].blocks', '~k_parent': 'grandparent' },
      child: { key: 'root.pages[0:home].blocks[0:if_box:Box]', '~k_parent': 'parent' },
    }),
  ],
  [
    'short',
    (ignored) => ({
      grandparent: { s: '[0:home]', p: 'pages', i: ignored },
      parent: { s: '.blocks', p: 'grandparent' },
      child: { s: '[0:if_box:Box]', p: 'parent' },
    }),
  ],
];

test.each(grandparentKeyMaps)(
  'a rule slug on a grandparent suppresses in the %s shape',
  (_, keyMapOf) => {
    expect(shouldSuppressBuildCheck(pluginError, keyMapOf(['if-test']))).toBe(true);
    const otherRule = { ...pluginError, checkSlug: 'switch-branches', checkGroup: undefined };
    expect(shouldSuppressBuildCheck(otherRule, keyMapOf(['if-test']))).toBe(false);
  }
);

test.each(grandparentKeyMaps)(
  'plugin-checks on a grandparent suppresses the group in the %s shape',
  (_, keyMapOf) => {
    expect(shouldSuppressBuildCheck(pluginError, keyMapOf(['plugin-checks']))).toBe(true);
    const builtIn = { configKey: 'child', checkSlug: 'state-refs' };
    expect(shouldSuppressBuildCheck(builtIn, keyMapOf(['plugin-checks']))).toBe(false);
  }
);

test.each(grandparentKeyMaps)('true on a grandparent suppresses in the %s shape', (_, keyMapOf) => {
  expect(shouldSuppressBuildCheck({ configKey: 'child' }, keyMapOf(true))).toBe(true);
});
