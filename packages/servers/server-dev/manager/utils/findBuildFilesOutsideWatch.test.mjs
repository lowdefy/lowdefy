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

import findBuildFilesOutsideWatch from './findBuildFilesOutsideWatch.mjs';

let root;
let buildDirectory;
let configDirectory;

function writeRefMap(refMap) {
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json'), JSON.stringify(refMap));
  return path.join(buildDirectory, 'refMap.json');
}

function writeJitMaps(name, refMap) {
  const filePath = path.join(buildDirectory, 'jitMaps', name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ keyMap: {}, refMap }));
  return filePath;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-build-files-'));
  buildDirectory = path.join(root, 'app', '.lowdefy', 'server', 'build');
  configDirectory = path.join(root, 'app');
  fs.mkdirSync(buildDirectory, { recursive: true });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('findBuildFilesOutsideWatch returns files the build read outside the watched directories', () => {
  const refMapFile = writeRefMap({
    1: { parent: null },
    2: { parent: '1', path: 'pages.yaml' },
    3: { parent: '2', path: '../shared/header.yaml' },
    4: { parent: null, path: path.join(root, 'modules', 'layout', 'components', 'page.yaml') },
    5: { parent: '4', path: path.join(root, 'modules', 'shared', 'title-block.yaml') },
    6: { parent: '4', path: path.join(root, 'modules', 'shared', 'title-block.yaml') },
  });

  const files = findBuildFilesOutsideWatch({
    mapsFiles: [refMapFile],
    configDirectory,
    watchRoots: [configDirectory, path.join(root, 'modules', 'layout')],
  });

  expect(files).toEqual([
    path.join(root, 'shared', 'header.yaml'),
    path.join(root, 'modules', 'shared', 'title-block.yaml'),
  ]);
});

test('findBuildFilesOutsideWatch skips refs without a file path', () => {
  const refMapFile = writeRefMap({
    1: { parent: null },
    2: { parent: '1', path: null, original: { resolver: 'resolver.js' } },
  });

  const files = findBuildFilesOutsideWatch({
    mapsFiles: [refMapFile],
    configDirectory,
    watchRoots: [configDirectory],
  });

  expect(files).toEqual([]);
});

test("findBuildFilesOutsideWatch reads a JIT page build's refs from its jitMaps file alone", () => {
  writeRefMap({ 1: { parent: null, path: '../shared/skeleton.yaml' } });
  const jitMapsFile = writeJitMaps('abc123-1-1.json', {
    p_abc123_1: { parent: null, path: 'pages/home.yaml' },
    p_abc123_2: { parent: 'p_abc123_1', path: '../shared/header.yaml' },
  });

  const files = findBuildFilesOutsideWatch({
    mapsFiles: [jitMapsFile],
    configDirectory,
    watchRoots: [configDirectory],
  });

  expect(files).toEqual([path.join(root, 'shared', 'header.yaml')]);
});

test('findBuildFilesOutsideWatch skips a jitMaps file pruned before it was read', () => {
  const files = findBuildFilesOutsideWatch({
    mapsFiles: [path.join(buildDirectory, 'jitMaps', 'gone-1-1.json')],
    configDirectory,
    watchRoots: [configDirectory],
  });

  expect(files).toEqual([]);
});
