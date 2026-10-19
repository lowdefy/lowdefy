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

import fs from 'fs';
import os from 'os';
import path from 'path';

import readMergedMaps from './readMergedMaps.js';

let buildDirectory;

function write(file, data) {
  const filePath = path.join(buildDirectory, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-merged-maps-'));
  write('keyMap.json', { cfg_1: { key: 'root' } });
  write('refMap.json', { cfg_r: { parent: null, path: 'lowdefy.yaml' } });
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('readMergedMaps returns the config build maps when no page has been built', async () => {
  expect(await readMergedMaps({ buildDirectory })).toEqual({
    keyMap: { cfg_1: { key: 'root' } },
    refMap: { cfg_r: { parent: null, path: 'lowdefy.yaml' } },
  });
});

test('readMergedMaps adds every jitMaps file, the later write of an entry winning', async () => {
  write('jitMaps/abc-1-2.json', {
    keyMap: { cfg_abc_2: { key: 'root.blocks[0:b]' } },
    refMap: { cfg_abc_r: { parent: null, path: 'pages/b.yaml' } },
  });
  write('jitMaps/abc-1-10.json', {
    keyMap: { cfg_abc_3: { key: 'root.blocks[0:c]' } },
    refMap: { cfg_abc_r: { parent: null, path: 'pages/b.yaml', lineNumber: 1 } },
  });
  write('jitMaps/abc-1-1.json', {
    keyMap: { cfg_abc_1: { key: 'root' } },
    refMap: { cfg_abc_r: { parent: null } },
  });

  const { keyMap, refMap } = await readMergedMaps({ buildDirectory });

  expect(Object.keys(keyMap).sort()).toEqual(['cfg_1', 'cfg_abc_1', 'cfg_abc_2', 'cfg_abc_3']);
  expect(refMap.cfg_abc_r).toEqual({ parent: null, path: 'pages/b.yaml', lineNumber: 1 });
  expect(refMap.cfg_r).toEqual({ parent: null, path: 'lowdefy.yaml' });
});

test('readMergedMaps skips a jitMaps file still being written under its temporary name', async () => {
  write('jitMaps/abc-1-1.json', { keyMap: { cfg_abc_1: { key: 'root' } }, refMap: {} });
  fs.writeFileSync(
    path.join(buildDirectory, 'jitMaps', '.abc-1-2.json.123.abcd1234.tmp'),
    '{"keyM'
  );

  const { keyMap } = await readMergedMaps({ buildDirectory });

  expect(Object.keys(keyMap).sort()).toEqual(['cfg_1', 'cfg_abc_1']);
});
