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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import resolveConfigLocation from '../../../packages/utils/errors/src/resolveConfigLocation.js';
import compareBuilds from './compareBuilds.mjs';
import compareKeyMaps from './compareKeyMaps.mjs';
import createKeyMapComparer from './createKeyMapComparer.mjs';
import formatKeyMapComparison from './formatKeyMapComparison.mjs';
import readKeyMaps from './readKeyMaps.mjs';

const refMap = {
  1: { parent: null },
  2: { parent: '1', path: 'pages/home.yaml' },
  3: { parent: '1', path: 'pages/about.yaml' },
};

function oldShapeKeyMap() {
  return {
    a: { key: 'root', '~k_parent': 'z', '~l': 1 },
    b: { key: 'root.pages', '~k_parent': 'a', '~l': 3 },
    c: { key: 'root.pages[0:home]', '~k_parent': 'b', '~r': '2', '~l': 1 },
    d: { key: 'root.pages[0:home].blocks[0:title]', '~k_parent': 'c', '~r': '2', '~l': 4 },
    e: { key: 'root.pages[0:home].events.onMount', '~k_parent': 'c' },
  };
}

// The same map in LDF-857's short shape: own segment, parent, ref only where
// it differs from the parent's (null for none), line.
function newShapeKeyMap() {
  return {
    a: { s: 'root', p: 'z', l: 1 },
    b: { s: '.pages', p: 'a', l: 3 },
    c: { s: '[0:home]', p: 'b', r: '2', l: 1 },
    d: { s: '.blocks[0:title]', p: 'c', l: 4 },
    e: { s: '.events.onMount', p: 'c', r: null },
  };
}

// A stand-in for a new-shape resolveConfigLocation: walks the parents to
// rebuild the path and finds the nearest ref.
function resolveNewShape({ configKey, keyMap, refMap: refs }) {
  const entry = keyMap[configKey];
  if (entry === undefined) {
    return null;
  }
  const segments = [];
  let ref;
  let current = entry;
  while (current !== undefined) {
    segments.unshift(current.s);
    if (ref === undefined && current.r !== undefined) {
      ref = current.r;
    }
    current = keyMap[current.p];
  }
  const file = refs[ref]?.path ?? 'lowdefy.yaml';
  return {
    source: entry.l ? `${file}:${entry.l}` : file,
    config: segments.join(''),
  };
}

function side(keyMap, resolve = resolveConfigLocation) {
  return { keyMap, refMap, resolve };
}

test('compareKeyMaps finds the same map identical with every id checked', () => {
  const comparison = compareKeyMaps({ old: side(oldShapeKeyMap()), new: side(oldShapeKeyMap()) });
  assert.deepEqual(comparison, {
    identical: true,
    checked: 5,
    differences: [],
    extraIds: [],
    missingIds: [],
  });
});

test('compareKeyMaps reports an id whose line changed with both lines', () => {
  const changed = oldShapeKeyMap();
  changed.d['~l'] = 5;
  const comparison = compareKeyMaps({ old: side(oldShapeKeyMap()), new: side(changed) });
  assert.equal(comparison.identical, false);
  assert.deepEqual(comparison.differences, [
    {
      id: 'd',
      old: { source: 'pages/home.yaml', line: 4, config: 'root.pages[0:home].blocks[0:title]' },
      new: { source: 'pages/home.yaml', line: 5, config: 'root.pages[0:home].blocks[0:title]' },
    },
  ]);
});

test('compareKeyMaps reports an id whose ref changed with a different source', () => {
  const changed = oldShapeKeyMap();
  changed.d['~r'] = '3';
  const comparison = compareKeyMaps({ old: side(oldShapeKeyMap()), new: side(changed) });
  assert.equal(comparison.identical, false);
  assert.equal(comparison.differences.length, 1);
  assert.equal(comparison.differences[0].id, 'd');
  assert.equal(comparison.differences[0].old.source, 'pages/home.yaml');
  assert.equal(comparison.differences[0].new.source, 'pages/about.yaml');
});

test('compareKeyMaps reports a removed entry under missingIds and an added one under extraIds', () => {
  const changed = oldShapeKeyMap();
  delete changed.e;
  changed.f = { key: 'root.menus', '~k_parent': 'a', '~l': 9 };
  const comparison = compareKeyMaps({ old: side(oldShapeKeyMap()), new: side(changed) });
  assert.equal(comparison.identical, false);
  assert.deepEqual(comparison.missingIds, ['e']);
  assert.deepEqual(comparison.extraIds, ['f']);
  assert.equal(comparison.checked, 4);
  assert.deepEqual(comparison.differences, []);
});

test('compareKeyMaps reads each side with its own resolver, so a new entry shape compares by meaning', () => {
  const comparison = compareKeyMaps({
    old: side(oldShapeKeyMap()),
    new: side(newShapeKeyMap(), resolveNewShape),
  });
  assert.equal(comparison.identical, true);
  assert.equal(comparison.checked, 5);
});

test('compareKeyMaps reports a config path that differs between entry shapes', () => {
  const changed = newShapeKeyMap();
  changed.d.s = '.blocks[0:heading]';
  const comparison = compareKeyMaps({
    old: side(oldShapeKeyMap()),
    new: side(changed, resolveNewShape),
  });
  assert.deepEqual(
    comparison.differences.map(({ id, old, new: after }) => [id, old.config, after.config]),
    [['d', 'root.pages[0:home].blocks[0:title]', 'root.pages[0:home].blocks[0:heading]']]
  );
});

test('compareKeyMaps reports an id that resolves on one side only', () => {
  const comparison = compareKeyMaps({
    old: side(oldShapeKeyMap()),
    new: side(oldShapeKeyMap(), ({ configKey, ...rest }) =>
      configKey === 'b' ? null : resolveConfigLocation({ configKey, ...rest })
    ),
  });
  assert.deepEqual(comparison.differences, [
    { id: 'b', old: { source: 'lowdefy.yaml', line: 3, config: 'root.pages' }, new: null },
  ]);
});

test('formatKeyMapComparison shows the counts, the ids on one side only and each differing field', () => {
  const lines = formatKeyMapComparison({
    comparison: {
      identical: false,
      checked: 3,
      missingIds: ['x'],
      extraIds: [],
      differences: [
        {
          id: 'd',
          old: { source: 'pages/home.yaml', line: 4, config: 'root.pages' },
          new: { source: 'pages/about.yaml', line: 5, config: 'root.pages' },
        },
        { id: 'b', old: { source: 'lowdefy.yaml', line: 3, config: 'root' }, new: null },
      ],
    },
  });
  assert.deepEqual(lines, [
    '3 key ids resolved on both sides; 1 only in old, 0 only in new, 2 resolve differently.',
    'Only in old: x',
    'd: source "pages/home.yaml" → "pages/about.yaml"',
    'd: line 4 → 5',
    'b: {"source":"lowdefy.yaml","line":3,"config":"root"} → (does not resolve)',
    'Key maps differ.',
  ]);
});

test('formatKeyMapComparison shows only the first differences past the limit', () => {
  const differences = Array.from({ length: 25 }, (_, index) => ({
    id: `k${index}`,
    old: { source: 'a.yaml', line: 1, config: 'root' },
    new: { source: 'a.yaml', line: 2, config: 'root' },
  }));
  const lines = formatKeyMapComparison({
    comparison: { identical: false, checked: 25, missingIds: [], extraIds: [], differences },
  });
  assert.equal(lines.length, 1 + 20 + 1 + 1);
  assert.equal(lines[21], '… and 5 more ids that resolve differently.');
});

function makeTempDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'compare-key-maps-'));
}

test('readKeyMaps reads a build folder and a fixture snapshot.json', () => {
  const root = makeTempDirectory();
  const build = path.join(root, 'build');
  fs.mkdirSync(build);
  fs.writeFileSync(path.join(build, 'keyMap.json'), JSON.stringify(oldShapeKeyMap()));
  fs.writeFileSync(path.join(build, 'refMap.json'), JSON.stringify(refMap));
  const snapshot = path.join(root, 'snapshot.json');
  fs.writeFileSync(
    snapshot,
    JSON.stringify({ 'app.json': {}, 'keyMap.json': oldShapeKeyMap(), 'refMap.json': refMap })
  );
  const expected = { keyMap: oldShapeKeyMap(), refMap };
  assert.deepEqual(readKeyMaps({ location: build }), expected);
  assert.deepEqual(readKeyMaps({ location: snapshot }), expected);
  fs.rmSync(root, { recursive: true });
});

test('readKeyMaps throws when a build folder has no refMap.json', () => {
  const root = makeTempDirectory();
  fs.writeFileSync(path.join(root, 'keyMap.json'), '{}');
  assert.throws(() => readKeyMaps({ location: root }), /has no refMap\.json/);
  fs.rmSync(root, { recursive: true });
});

function writeServer({ root, name, keyMap }) {
  const serverDirectory = path.join(root, name);
  fs.mkdirSync(path.join(serverDirectory, 'build'), { recursive: true });
  fs.writeFileSync(path.join(serverDirectory, 'package.json'), '{}');
  fs.writeFileSync(path.join(serverDirectory, 'build', 'keyMap.json'), JSON.stringify(keyMap));
  fs.writeFileSync(path.join(serverDirectory, 'build', 'refMap.json'), JSON.stringify(refMap));
  return { output: '', serverDirectory };
}

test('createKeyMapComparer lets compareBuilds accept a key map in a new shape that says the same', async () => {
  const root = makeTempDirectory();
  const logged = [];
  const comparison = await compareBuilds({
    baseline: writeServer({ root, name: 'baseline', keyMap: oldShapeKeyMap() }),
    current: writeServer({ root, name: 'current', keyMap: newShapeKeyMap() }),
    comparers: {
      'build/keyMap.json': createKeyMapComparer({
        logger: { info: (line) => logged.push(line) },
        resolve: { baseline: resolveConfigLocation, current: resolveNewShape },
      }),
    },
  });
  assert.equal(comparison.identical, true);
  assert.deepEqual(logged, [
    'keyMap.json by meaning: 5 key ids resolved on both sides; 0 only in old, 0 only in new, 0 resolve differently.',
  ]);
  fs.rmSync(root, { recursive: true });
});

test('createKeyMapComparer reports a key map that resolves differently as a differing file', async () => {
  const root = makeTempDirectory();
  const changed = newShapeKeyMap();
  changed.d.l = 7;
  const comparison = await compareBuilds({
    baseline: writeServer({ root, name: 'baseline', keyMap: oldShapeKeyMap() }),
    current: writeServer({ root, name: 'current', keyMap: changed }),
    comparers: {
      'build/keyMap.json': createKeyMapComparer({
        logger: { info: () => {} },
        resolve: { baseline: resolveConfigLocation, current: resolveNewShape },
      }),
    },
  });
  assert.equal(comparison.identical, false);
  assert.equal(comparison.differences.length, 1);
  assert.equal(comparison.differences[0].file, 'build/keyMap.json');
  assert.ok(comparison.differences[0].lines.includes('d: line 4 → 7'));
  fs.rmSync(root, { recursive: true });
});
