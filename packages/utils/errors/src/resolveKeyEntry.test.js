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

import resolveConfigLocation from './resolveConfigLocation.js';
import resolveKeyEntry from './resolveKeyEntry.js';

// One config tree in each shape. The root's parent id is never written, as
// addKeys leaves it.
const fullKeyMap = {
  root: { key: 'root', '~k_parent': 'unwritten' },
  pages: { key: 'root.pages', '~k_parent': 'root', '~r': 'refPages', '~l': 3 },
  home: { key: 'root.pages[0:home]', '~k_parent': 'pages', '~r': 'refPages', '~l': 4 },
  blocks: { key: 'root.pages[0:home].blocks', '~k_parent': 'home', '~r': 'refPages', '~l': 6 },
  header: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~k_parent': 'blocks',
    '~r': 'refPages',
    '~l': 7,
  },
  button: {
    key: 'root.pages[0:home].blocks[2:my_button:Button]',
    '~k_parent': 'blocks',
    '~r': 'refButton',
    '~l': 2,
    '~ignoreBuildChecks': ['state-refs'],
  },
  onMount: {
    key: 'root.pages[0:home].blocks[0:header].events.onMountAsync',
    '~k_parent': 'header',
  },
  grid: { key: 'root.pages[0:home].grid', '~k_parent': 'home', '~r': 'refPages', '~l': 9 },
  gridCell: { key: 'root.pages[0:home].grid[0][1]', '~k_parent': 'grid', '~r': 'refPages' },
};

const shortKeyMap = {
  root: { s: 'root', p: 'unwritten' },
  pages: { s: '.pages', p: 'root', r: 'refPages', l: 3 },
  home: { s: '[0:home]', p: 'pages', l: 4 },
  blocks: { s: '.blocks', p: 'home', l: 6 },
  header: { s: '[0:header]', p: 'blocks', l: 7 },
  button: { s: '[2:my_button:Button]', p: 'blocks', r: 'refButton', l: 2, i: ['state-refs'] },
  onMount: { s: '.events.onMountAsync', p: 'header', r: null },
  grid: { s: '.grid', p: 'home', l: 9 },
  gridCell: { s: '[0][1]', p: 'grid' },
};

const shapes = [
  ['full', fullKeyMap],
  ['short', shortKeyMap],
];

test.each(shapes)('resolveKeyEntry resolves a nested object in the %s shape', (_, keyMap) => {
  expect(resolveKeyEntry({ keyMap, configKey: 'blocks' })).toEqual({
    path: 'root.pages[0:home].blocks',
    refId: 'refPages',
    line: 6,
    parentId: 'home',
    ignoreBuildChecks: null,
  });
});

test.each(shapes)('resolveKeyEntry resolves array items in the %s shape', (_, keyMap) => {
  expect(resolveKeyEntry({ keyMap, configKey: 'header' })).toMatchObject({
    path: 'root.pages[0:home].blocks[0:header]',
    refId: 'refPages',
    line: 7,
    parentId: 'blocks',
  });
  expect(resolveKeyEntry({ keyMap, configKey: 'button' })).toEqual({
    path: 'root.pages[0:home].blocks[2:my_button:Button]',
    refId: 'refButton',
    line: 2,
    parentId: 'blocks',
    ignoreBuildChecks: ['state-refs'],
  });
});

test.each(shapes)('resolveKeyEntry resolves a nested array item in the %s shape', (_, keyMap) => {
  expect(resolveKeyEntry({ keyMap, configKey: 'gridCell' })).toMatchObject({
    path: 'root.pages[0:home].grid[0][1]',
    refId: 'refPages',
    line: null,
  });
});

test('resolveKeyEntry inherits a ref from a grandparent in the short shape', () => {
  expect(resolveKeyEntry({ keyMap: shortKeyMap, configKey: 'header' }).refId).toEqual('refPages');
});

test.each(shapes)(
  'resolveKeyEntry gives an entry its own ref when it differs from the parent in the %s shape',
  (_, keyMap) => {
    expect(resolveKeyEntry({ keyMap, configKey: 'button' }).refId).toEqual('refButton');
  }
);

test.each(shapes)(
  'resolveKeyEntry gives a build-created node under a ref no ref in the %s shape',
  (_, keyMap) => {
    expect(resolveKeyEntry({ keyMap, configKey: 'onMount' })).toEqual({
      path: 'root.pages[0:home].blocks[0:header].events.onMountAsync',
      refId: null,
      line: null,
      parentId: 'header',
      ignoreBuildChecks: null,
    });
    expect(
      resolveConfigLocation({
        configKey: 'onMount',
        keyMap,
        refMap: { refPages: { path: 'pages.yaml' } },
      })
    ).toEqual({
      source: 'lowdefy.yaml',
      config: 'root.pages[0:home].blocks[0:header].events.onMountAsync',
    });
  }
);

test('resolveKeyEntry gives a full-shape entry with no ~r no ref even when its parent has one', () => {
  const keyMap = {
    parent: { key: 'root.pages', '~k_parent': 'unwritten', '~r': 'refPages' },
    child: { key: 'root.pages[0:home]', '~k_parent': 'parent' },
  };
  expect(resolveKeyEntry({ keyMap, configKey: 'child' }).refId).toBeNull();
});

test.each(shapes)(
  'resolveKeyEntry resolves the root, whose parent is not in the map, in the %s shape',
  (_, keyMap) => {
    expect(resolveKeyEntry({ keyMap, configKey: 'root' })).toEqual({
      path: 'root',
      refId: null,
      line: null,
      parentId: 'unwritten',
      ignoreBuildChecks: null,
    });
  }
);

test.each(shapes)(
  'resolveKeyEntry returns null for an unknown configKey in the %s shape',
  (_, keyMap) => {
    expect(resolveKeyEntry({ keyMap, configKey: 'missing' })).toBeNull();
    expect(resolveKeyEntry({ keyMap, configKey: undefined })).toBeNull();
    expect(resolveKeyEntry({ keyMap, configKey: null })).toBeNull();
  }
);

test('resolveKeyEntry returns null without a keyMap', () => {
  expect(resolveKeyEntry({ keyMap: undefined, configKey: 'root' })).toBeNull();
});

test('resolveKeyEntry ends the walk when a corrupt map cycles', () => {
  const keyMap = {
    a: { s: '.a', p: 'b' },
    b: { s: '.b', p: 'a', r: 'refB' },
  };
  expect(resolveKeyEntry({ keyMap, configKey: 'a' })).toMatchObject({
    path: '.b.a',
    refId: 'refB',
  });
});

test('resolveKeyEntry joins a short entry onto a full-shape ancestor and takes its ref', () => {
  const keyMap = {
    parent: { key: 'root.pages[0:home]', '~k_parent': 'unwritten', '~r': 'refPages', '~l': 4 },
    child: { s: '.blocks', p: 'parent', l: 6 },
  };
  expect(resolveKeyEntry({ keyMap, configKey: 'child' })).toEqual({
    path: 'root.pages[0:home].blocks',
    refId: 'refPages',
    line: 6,
    parentId: 'parent',
    ignoreBuildChecks: null,
  });
});

test.each(shapes)(
  'resolveConfigLocation gives the same source and config in the %s shape',
  (_, keyMap) => {
    expect(
      resolveConfigLocation({
        configKey: 'button',
        keyMap,
        refMap: { refButton: { path: 'blocks/button.yaml' } },
        configDirectory: '/app',
      })
    ).toEqual({
      source: '/app/blocks/button.yaml:2',
      config: 'root.pages[0:home].blocks[2:my_button:Button]',
    });
  }
);
