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
import zlib from 'node:zlib';

import compareBuilds, { BUILD_MESSAGES } from './compareBuilds.mjs';

// Two server directories whose build/ files may hold their own server path,
// written as {server} in the file contents given.
function setup({ baseline, current }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compare-builds-'));
  function writeSide(name, files) {
    const serverDirectory = path.join(root, name);
    for (const [file, content] of Object.entries(files)) {
      const filePath = path.join(serverDirectory, file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        typeof content === 'string' ? content.replaceAll('{server}', serverDirectory) : content
      );
    }
    return { output: '', serverDirectory };
  }
  return {
    baseline: writeSide('baseline', baseline),
    current: writeSide('current', current),
    cleanup: () => fs.rmSync(root, { recursive: true }),
  };
}

const packageJson = '{"name":"@lowdefy/server"}\n';

test('compareBuilds finds builds identical when only the server directory differs', async () => {
  const files = {
    'build/plugins.json': '{"path":"{server}/build/plugins/blocks.js"}',
    'build/pages/home.json': '{"id":"home"}',
    'package.json': packageJson,
  };
  const { baseline, current, cleanup } = setup({ baseline: files, current: files });
  const comparison = await compareBuilds({ baseline, current });
  assert.equal(comparison.identical, true);
  assert.equal(comparison.compared, 3);
  assert.deepEqual(comparison.differences, []);
  cleanup();
});

test('compareBuilds reports a differing JSON file with its paths', async () => {
  const { baseline, current, cleanup } = setup({
    baseline: { 'build/menus.json': '{"menus":[{"id":"default"}]}', 'package.json': packageJson },
    current: {
      'build/menus.json': '{"menus":[{"id":"default","extra":1}]}',
      'package.json': packageJson,
    },
  });
  const comparison = await compareBuilds({ baseline, current });
  assert.equal(comparison.identical, false);
  assert.deepEqual(comparison.differences, [
    { file: 'build/menus.json', identical: false, lines: ['menus[0].extra: (missing) → 1'] },
  ]);
  cleanup();
});

test('compareBuilds lists files only one side has', async () => {
  const { baseline, current, cleanup } = setup({
    baseline: { 'build/old.json': '{}', 'package.json': packageJson },
    current: { 'build/new.json': '{}', 'package.json': packageJson },
  });
  const comparison = await compareBuilds({ baseline, current });
  assert.equal(comparison.identical, false);
  assert.deepEqual(comparison.onlyBaseline, ['build/old.json']);
  assert.deepEqual(comparison.onlyCurrent, ['build/new.json']);
  cleanup();
});

test('compareBuilds allows an expected added gzip file that gunzips to its plain file', async () => {
  const keyMap = '{"a":{"key":"root"}}';
  const { baseline, current, cleanup } = setup({
    baseline: { 'build/keyMap.json': keyMap, 'package.json': packageJson },
    current: {
      'build/keyMap.json': keyMap,
      'build/keyMap.json.gz': zlib.gzipSync(keyMap),
      'package.json': packageJson,
    },
  });
  const comparison = await compareBuilds({ baseline, current, expectAdded: ['keyMap.json.gz'] });
  assert.equal(comparison.identical, true);
  assert.deepEqual(comparison.onlyCurrent, []);
  assert.deepEqual(comparison.added, [
    { file: 'build/keyMap.json.gz', identical: true, lines: [] },
  ]);
  cleanup();
});

test('compareBuilds fails an expected added gzip file that does not match its plain file', async () => {
  const { baseline, current, cleanup } = setup({
    baseline: { 'build/keyMap.json': '{}', 'package.json': packageJson },
    current: {
      'build/keyMap.json': '{}',
      'build/keyMap.json.gz': zlib.gzipSync('{"other":1}'),
      'package.json': packageJson,
    },
  });
  const comparison = await compareBuilds({ baseline, current, expectAdded: ['keyMap.json.gz'] });
  assert.equal(comparison.identical, false);
  assert.deepEqual(comparison.added, [
    {
      file: 'build/keyMap.json.gz',
      identical: false,
      lines: ['Does not gunzip to build/keyMap.json.'],
    },
  ]);
  cleanup();
});

test('compareBuilds fails an expected added file the current build does not have', async () => {
  const { baseline, current, cleanup } = setup({
    baseline: { 'package.json': packageJson },
    current: { 'package.json': packageJson },
  });
  const comparison = await compareBuilds({ baseline, current, expectAdded: ['refMap.json.gz'] });
  assert.equal(comparison.identical, false);
  assert.equal(comparison.added[0].lines[0], 'Expected in the current build, but missing.');
  cleanup();
});

test('compareBuilds uses a comparer given for a file in place of the byte comparison', async () => {
  const { baseline, current, cleanup } = setup({
    baseline: { 'build/keyMap.json': '{"1":{}}', 'package.json': packageJson },
    current: { 'build/keyMap.json': '{"2":{}}', 'package.json': packageJson },
  });
  const calls = [];
  const comparison = await compareBuilds({
    baseline,
    current,
    comparers: {
      'build/keyMap.json': async (args) => {
        calls.push(args);
        return { identical: true, lines: [] };
      },
    },
  });
  assert.equal(comparison.identical, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, 'build/keyMap.json');
  assert.equal(calls[0].baseline.serverDirectory, baseline.serverDirectory);
  assert.equal(calls[0].current.replacePath(`${current.serverDirectory}/x`), '<server>/x');
  cleanup();
});

test('compareBuilds compares the warnings and errors the builds logged', async () => {
  const { baseline, current, cleanup } = setup({
    baseline: { 'package.json': packageJson },
    current: { 'package.json': packageJson },
  });
  baseline.output = '11:00:00 ⚠ Same warning.\n11:00:01 ⚠ Old warning.';
  current.output = '11:00:05 ⚠ Same warning.';
  const comparison = await compareBuilds({ baseline, current });
  assert.equal(comparison.identical, false);
  assert.equal(comparison.differences[0].file, BUILD_MESSAGES);
  assert.ok(comparison.differences[0].lines.includes('-⚠ Old warning.'));
  cleanup();
});
