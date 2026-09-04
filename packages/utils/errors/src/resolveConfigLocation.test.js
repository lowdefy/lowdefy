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

import resolveConfigLocation from './resolveConfigLocation.js';

const keyMap = {
  abc123: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
  },
  def456: {
    key: 'root.connections[0:mongodb]',
    '~r': 'ref2',
    '~l': 42,
  },
  withColumn: {
    key: 'root.pages[0:home].blocks[0:header].properties.visible',
    '~r': 'ref1',
    '~l': 5,
    '~c': 12,
  },
  noLine: {
    key: 'root.global',
    '~r': 'ref1',
  },
  noRef: {
    key: 'root.something',
    '~l': 10,
  },
  moduleVar: {
    key: 'root.blocks[0:page-content:Box].blocks[1:score_tag:Tag]',
    '~r': 'moduleRef',
    '~l': 178,
  },
  orphanRef: {
    key: 'root.blocks[0:thing]',
    '~r': 'cyclicRef',
    '~l': 3,
  },
  // A node cloned into a component instance: its own key names the instance
  // site, ~k_source names the authored node it was cloned from.
  instanceNode: {
    key: 'stale.instance.path',
    '~r': 'ref2',
    '~l': 99,
    '~k_parent': 'abc123',
    '~k_source': 'abc123',
  },
  instanceNodeUnknownSource: {
    key: 'root.pages[0:home].blocks[0:pill].blocks[0:label]',
    '~r': 'ref1',
    '~l': 7,
    '~k_source': 'notInThisBuild',
  },
};

const refMap = {
  ref1: { path: 'pages/home.yaml' },
  ref2: { path: 'connections/mongodb.yaml' },
  // A module invocation is not a file — content passed in via vars keeps ~l
  // line numbers pointing into the invoking file (the parent ref).
  moduleRef: {
    parent: 'ref1',
    lineNumber: 15,
    path: null,
    original: { module: 'layout', component: 'page' },
  },
  cyclicRef: { parent: 'cyclicRef', path: null },
};

test('resolveConfigLocation returns null for missing configKey', () => {
  expect(resolveConfigLocation({ configKey: null, keyMap, refMap })).toBeNull();
  expect(resolveConfigLocation({ configKey: undefined, keyMap, refMap })).toBeNull();
  expect(resolveConfigLocation({ configKey: '', keyMap, refMap })).toBeNull();
});

test('resolveConfigLocation returns null for missing keyMap', () => {
  expect(resolveConfigLocation({ configKey: 'abc123', keyMap: null, refMap })).toBeNull();
  expect(resolveConfigLocation({ configKey: 'abc123', keyMap: undefined, refMap })).toBeNull();
});

test('resolveConfigLocation returns null for configKey not in keyMap', () => {
  expect(resolveConfigLocation({ configKey: 'notfound', keyMap, refMap })).toBeNull();
});

test('resolveConfigLocation resolves full location with absolute path', () => {
  const result = resolveConfigLocation({
    configKey: 'abc123',
    keyMap,
    refMap,
    configDirectory: '/Users/dev/myapp',
  });

  expect(result).toEqual({
    source: '/Users/dev/myapp/pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveConfigLocation handles different file paths', () => {
  const result = resolveConfigLocation({
    configKey: 'def456',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/connections/mongodb.yaml:42',
    config: 'root.connections[0:mongodb]',
  });
});

test('resolveConfigLocation without configDirectory uses relative path', () => {
  const result = resolveConfigLocation({
    configKey: 'abc123',
    keyMap,
    refMap,
  });

  expect(result).toEqual({
    source: 'pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveConfigLocation renders file:line:column for a compiled expression node', () => {
  const result = resolveConfigLocation({
    configKey: 'withColumn',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/pages/home.yaml:5:12',
    config: 'root.pages[0:home].blocks[0:header].properties.visible',
  });
});

test('resolveConfigLocation without line number', () => {
  const result = resolveConfigLocation({
    configKey: 'noLine',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/pages/home.yaml',
    config: 'root.global',
  });
});

test('resolveConfigLocation resolves module var content to the invoking file', () => {
  const result = resolveConfigLocation({
    configKey: 'moduleVar',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/pages/home.yaml:178',
    config: 'root.blocks[0:page-content:Box].blocks[1:score_tag:Tag]',
  });
});

test('resolveConfigLocation falls back to lowdefy.yaml on a cyclic pathless ref chain', () => {
  const result = resolveConfigLocation({
    configKey: 'orphanRef',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/lowdefy.yaml:3',
    config: 'root.blocks[0:thing]',
  });
});

test('resolveConfigLocation defaults to lowdefy.yaml when ref not found', () => {
  const result = resolveConfigLocation({
    configKey: 'noRef',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/lowdefy.yaml:10',
    config: 'root.something',
  });
});

test('resolveConfigLocation with null refMap uses lowdefy.yaml', () => {
  const result = resolveConfigLocation({
    configKey: 'abc123',
    keyMap,
    refMap: null,
  });

  expect(result).toEqual({
    source: 'lowdefy.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveConfigLocation resolves a cloned instance node to the node it was cloned from', () => {
  const result = resolveConfigLocation({ configKey: 'instanceNode', keyMap, refMap });
  expect(result).toEqual({
    source: 'pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveConfigLocation falls back to the entry when ~k_source is not in the keyMap', () => {
  const result = resolveConfigLocation({
    configKey: 'instanceNodeUnknownSource',
    keyMap,
    refMap,
  });
  expect(result).toEqual({
    source: 'pages/home.yaml:7',
    config: 'root.pages[0:home].blocks[0:pill].blocks[0:label]',
  });
});
