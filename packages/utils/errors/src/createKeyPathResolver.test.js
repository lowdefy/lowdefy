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

import { expect, test } from 'vitest';

import createKeyPathResolver from './createKeyPathResolver.js';
import resolveKeyEntry from './resolveKeyEntry.js';

// Two trees in the short shape, one in the full shape, and short entries under
// a full-shape parent.
const mixedKeyMap = {
  root: { s: 'root', p: 'unwritten' },
  pages: { s: '.pages', p: 'root', r: 'refPages', l: 3 },
  home: { s: '[0:home]', p: 'pages', l: 4 },
  blocks: { s: '.blocks', p: 'home', l: 6 },
  header: { s: '[0:header]', p: 'blocks', l: 7, i: true },
  button: { s: '[2:my_button:Button]', p: 'blocks', r: 'refButton', l: 2 },
  buttonProps: { s: '.properties', p: 'button', l: 3 },
  onMount: { s: '.events.onMountAsync', p: 'header', r: null },
  onMountItem: { s: '[0:set:SetState]', p: 'onMount' },
  grid: { s: '.grid', p: 'home' },
  gridCell: { s: '[0][1]', p: 'grid' },
  jitRoot: { s: 'root', p: 'jit-unwritten', r: 'refJit', l: 1 },
  jitBlocks: { s: '.blocks', p: 'jitRoot', l: 2 },
  fullRoot: { key: 'root', '~k_parent': 'full-unwritten', '~r': 'refFull' },
  fullChild: { key: 'root.menus', '~k_parent': 'fullRoot', '~l': 8 },
  shortUnderFull: { s: '[0:default]', p: 'fullChild', l: 9 },
  shortRefUnderFull: { s: '.links', p: 'shortUnderFull' },
};

function countingKeyMap(keyMap) {
  const reads = new Map();
  const proxy = new Proxy(keyMap, {
    get(target, property) {
      if (Object.hasOwn(target, property)) {
        reads.set(property, (reads.get(property) ?? 0) + 1);
      }
      return target[property];
    },
  });
  return { proxy, reads };
}

test('createKeyPathResolver gives the same result as resolveKeyEntry for every entry of a mixed map', () => {
  const resolveKeyPath = createKeyPathResolver({ keyMap: mixedKeyMap });
  Object.keys(mixedKeyMap).forEach((configKey) => {
    expect(resolveKeyPath(configKey)).toEqual(resolveKeyEntry({ keyMap: mixedKeyMap, configKey }));
  });
});

test('createKeyPathResolver gives the same result in reverse scan order', () => {
  const resolveKeyPath = createKeyPathResolver({ keyMap: mixedKeyMap });
  Object.keys(mixedKeyMap)
    .reverse()
    .forEach((configKey) => {
      expect(resolveKeyPath(configKey)).toEqual(
        resolveKeyEntry({ keyMap: mixedKeyMap, configKey })
      );
    });
});

test('createKeyPathResolver reads each entry once over a whole-map scan', () => {
  const { proxy, reads } = countingKeyMap(mixedKeyMap);
  const resolveKeyPath = createKeyPathResolver({ keyMap: proxy });
  Object.keys(mixedKeyMap)
    .reverse()
    .forEach((configKey) => resolveKeyPath(configKey));
  Object.keys(mixedKeyMap).forEach((configKey) => resolveKeyPath(configKey));
  expect([...reads.keys()].sort()).toEqual(Object.keys(mixedKeyMap).sort());
  reads.forEach((count) => expect(count).toBe(1));
});

test('createKeyPathResolver returns null for an unknown or missing configKey', () => {
  const resolveKeyPath = createKeyPathResolver({ keyMap: mixedKeyMap });
  expect(resolveKeyPath('missing')).toBeNull();
  expect(resolveKeyPath(undefined)).toBeNull();
  expect(resolveKeyPath(null)).toBeNull();
});

test('createKeyPathResolver ends when a corrupt map cycles, as resolveKeyEntry does', () => {
  const keyMap = {
    a: { s: '.a', p: 'b' },
    b: { s: '.b', p: 'a', r: 'refB' },
    c: { s: '.c', p: 'a' },
  };
  const resolveKeyPath = createKeyPathResolver({ keyMap });
  ['c', 'a', 'b'].forEach((configKey) => {
    expect(resolveKeyPath(configKey)).toEqual(resolveKeyEntry({ keyMap, configKey }));
  });
});
