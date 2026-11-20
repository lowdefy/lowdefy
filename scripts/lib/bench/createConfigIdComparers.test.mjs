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
import compareMultisets from './compareMultisets.mjs';
import createConfigIdComparers from './createConfigIdComparers.mjs';
import createIdDescriber from './createIdDescriber.mjs';
import replaceConfigIds from './replaceConfigIds.mjs';

const resolve = { baseline: resolveConfigLocation, current: resolveConfigLocation };

// The baseline build: old-shape key map, refs numbered 1 to 3.
function baselineBuild() {
  return {
    'build/keyMap.json': {
      a: { key: 'root', '~k_parent': 'z', '~l': 1 },
      b: { key: 'root.pages', '~k_parent': 'a', '~l': 3 },
      c: { key: 'root.pages[0:home]', '~k_parent': 'b', '~r': '2', '~l': 1 },
      d: { key: 'root.pages[0:home].blocks[0:title]', '~k_parent': 'c', '~r': '2', '~l': 4 },
      e: { key: 'root.pages[0:about]', '~k_parent': 'b', '~r': '3', '~l': 1 },
    },
    'build/refMap.json': {
      1: { parent: null },
      2: { parent: '1', path: 'pages/home.yaml', lineNumber: 3 },
      3: { parent: '1', path: 'pages/about.yaml', lineNumber: 4 },
    },
    'build/pages/home.json': {
      id: 'home',
      '~k': 'c',
      blocks: [{ id: 'title', '~k': 'd' }],
    },
    'package.json': { name: '@lowdefy/server' },
  };
}

// The same config built again: short-shape key map, every key and ref id
// numbered differently.
function renumberedBuild() {
  return {
    'build/keyMap.json': {
      k5: { s: 'root', p: 'none', l: 1 },
      k4: { s: '.pages', p: 'k5', l: 3 },
      k3: { s: '[0:home]', p: 'k4', r: 'home', l: 1 },
      k2: { s: '.blocks[0:title]', p: 'k3', l: 4 },
      k1: { s: '[0:about]', p: 'k4', r: 'about', l: 1 },
    },
    'build/refMap.json': {
      root: { parent: null },
      home: { parent: 'root', path: 'pages/home.yaml', lineNumber: 3 },
      about: { parent: 'root', path: 'pages/about.yaml', lineNumber: 4 },
    },
    'build/pages/home.json': {
      id: 'home',
      '~k': 'k3',
      blocks: [{ id: 'title', '~k': 'k2' }],
    },
    'package.json': { name: '@lowdefy/server' },
  };
}

function setup({ baseline, current }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'config-id-comparers-'));
  function writeSide(name, files) {
    const serverDirectory = path.join(root, name);
    for (const [file, content] of Object.entries(files)) {
      const filePath = path.join(serverDirectory, file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(content));
    }
    return { output: '', serverDirectory };
  }
  return {
    baseline: writeSide('baseline', baseline),
    current: writeSide('current', current),
    cleanup: () => fs.rmSync(root, { recursive: true }),
  };
}

async function compareWithIds({ baseline, current }) {
  const logged = [];
  const sides = setup({ baseline, current });
  const comparison = await compareBuilds({
    baseline: sides.baseline,
    current: sides.current,
    ...createConfigIdComparers({ logger: { info: (line) => logged.push(line) }, resolve }),
  });
  sides.cleanup();
  return { comparison, logged };
}

test('createConfigIdComparers finds a build with every key and ref id renumbered identical', async () => {
  const { comparison, logged } = await compareWithIds({
    baseline: baselineBuild(),
    current: renumberedBuild(),
  });
  assert.deepEqual(comparison.differences, []);
  assert.equal(comparison.identical, true);
  assert.deepEqual(logged, [
    'keyMap.json by meaning: 5 key ids in baseline, 5 in current; 0 only in baseline, 0 only in current.',
    'refMap.json by meaning: 3 ref ids in baseline, 3 in current; 0 only in baseline, 0 only in current.',
  ]);
});

test('createConfigIdComparers reports a node whose line changed in the artifact and the key map', async () => {
  const current = renumberedBuild();
  current['build/keyMap.json'].k2.l = 7;
  const { comparison } = await compareWithIds({ baseline: baselineBuild(), current });
  assert.equal(comparison.identical, false);
  assert.deepEqual(
    comparison.differences.map(({ file }) => file),
    ['build/keyMap.json', 'build/pages/home.json']
  );
  assert.deepEqual(comparison.differences[0].lines, [
    '5 key ids in baseline, 5 in current; 1 only in baseline, 1 only in current.',
    'Only in baseline: pages/home.yaml:4 root.pages[0:home].blocks[0:title]',
    'Only in current: pages/home.yaml:7 root.pages[0:home].blocks[0:title]',
  ]);
  assert.deepEqual(comparison.differences[1].lines, [
    'blocks[0].~k: "pages/home.yaml:4 root.pages[0:home].blocks[0:title]" → "pages/home.yaml:7 root.pages[0:home].blocks[0:title]"',
  ]);
});

test('createConfigIdComparers reports an artifact value that changed under renumbered ids', async () => {
  const current = renumberedBuild();
  current['build/pages/home.json'].blocks[0].id = 'heading';
  const { comparison } = await compareWithIds({ baseline: baselineBuild(), current });
  assert.deepEqual(comparison.differences, [
    {
      file: 'build/pages/home.json',
      identical: false,
      lines: ['blocks[0].id: "title" → "heading"'],
    },
  ]);
});

test('createConfigIdComparers reports a ref that points at another file', async () => {
  const current = renumberedBuild();
  current['build/refMap.json'].about.path = 'pages/contact.yaml';
  const { comparison } = await compareWithIds({ baseline: baselineBuild(), current });
  const files = comparison.differences.map(({ file }) => file);
  assert.deepEqual(files, ['build/keyMap.json', 'build/refMap.json']);
  assert.deepEqual(comparison.differences[1].lines, [
    '3 ref ids in baseline, 3 in current; 1 only in baseline, 1 only in current.',
    'Only in baseline: pages/about.yaml:4 < (no path)',
    'Only in current: pages/contact.yaml:4 < (no path)',
  ]);
});

test('createIdDescriber describes a key that does not resolve and a ref missing from the map', () => {
  const describer = createIdDescriber({ keyMap: {}, refMap: {}, resolve: resolveConfigLocation });
  assert.equal(describer.describeKey('q'), '(key q does not resolve)');
  assert.equal(describer.describeRef('9'), '(ref 9 is not in refMap.json)');
});

test('createIdDescriber ends a ref parent cycle and keeps a ref original definition', () => {
  const describer = createIdDescriber({
    keyMap: {},
    refMap: {
      a: { parent: 'b', path: null, lineNumber: 2, original: { module: 'm' } },
      b: { parent: 'a', path: 'x.yaml' },
    },
    resolve: resolveConfigLocation,
  });
  assert.equal(
    describer.describeRef('a'),
    '(no path):2 {"module":"m"} < x.yaml < (ref a is its own ancestor)'
  );
});

test('replaceConfigIds replaces ~k and ~r at any depth and leaves other values', () => {
  const describer = { describeKey: (id) => `key ${id}`, describeRef: (id) => `ref ${id}` };
  const value = { '~k': 'a', list: [{ '~k': 'b', '~r': '1', n: 0 }, null, 'text'] };
  assert.deepEqual(replaceConfigIds({ value, describer }), {
    '~k': 'key a',
    list: [{ '~k': 'key b', '~r': 'ref 1', n: 0 }, null, 'text'],
  });
  assert.equal(value['~k'], 'a');
});

test('compareMultisets counts a repeated value and shows only the first values past the limit', () => {
  const comparison = compareMultisets({
    baseline: ['x', 'x', 'y'],
    current: ['x', 'z', 'w', 'v'],
    limit: 2,
  });
  assert.equal(comparison.identical, false);
  assert.deepEqual(comparison.onlyBaseline, { total: 2, values: ['x', 'y'] });
  assert.deepEqual(comparison.onlyCurrent, { total: 3, values: ['z', 'w'] });
  assert.equal(comparison.baselineCount, 3);
  assert.equal(comparison.currentCount, 4);
});

test('compareMultisets finds the same values in another order identical', () => {
  assert.equal(compareMultisets({ baseline: ['a', 'b'], current: ['b', 'a'] }).identical, true);
});
