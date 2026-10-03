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

import { jest } from '@jest/globals';

import skipStaleMapWrites from './skipStaleMapWrites.js';

let buildDirectory;

function publishBuild(prefix) {
  fs.writeFileSync(
    path.join(buildDirectory, 'idCounter.json'),
    JSON.stringify({ prefix, counter: 10 })
  );
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-stale-maps-'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true });
});

test('a page build writes its maps while its config build is the live one', async () => {
  publishBuild('a1b2_');
  const writeBuildArtifact = jest.fn();
  const context = { writeBuildArtifact };
  skipStaleMapWrites({ buildDirectory, context, keyPrefix: 'a1b2_', isKeptContext: () => true });

  await context.writeBuildArtifact('keyMap.json', '{}');
  await context.writeBuildArtifact('refMap.json', '{}');

  expect(writeBuildArtifact.mock.calls).toEqual([
    ['keyMap.json', '{}'],
    ['refMap.json', '{}'],
  ]);
});

test('a page build started before a config rebuild does not replace the new maps', async () => {
  publishBuild('a1b2_');
  const writeBuildArtifact = jest.fn();
  const context = { writeBuildArtifact };
  skipStaleMapWrites({ buildDirectory, context, keyPrefix: 'a1b2_', isKeptContext: () => true });

  publishBuild('c3d4_');
  await context.writeBuildArtifact('keyMap.json', '{}');
  await context.writeBuildArtifact('refMap.json', '{}');
  await context.writeBuildArtifact('pages/home.json', '{}');

  expect(writeBuildArtifact.mock.calls).toEqual([['pages/home.json', '{}']]);
});

test('a page build started before a config rebuild writes no jitMaps file', async () => {
  publishBuild('a1b2_');
  const writeBuildArtifact = jest.fn();
  const context = { writeBuildArtifact };
  skipStaleMapWrites({ buildDirectory, context, keyPrefix: 'a1b2_', isKeptContext: () => true });

  await context.writeBuildArtifact('jitMaps/abc123-1-1.json', '{}');
  publishBuild('c3d4_');
  await context.writeBuildArtifact('jitMaps/abc123-1-2.json', '{}');

  expect(writeBuildArtifact.mock.calls).toEqual([['jitMaps/abc123-1-1.json', '{}']]);
});

test('a page build on a context that is no longer kept does not write the JS maps', async () => {
  publishBuild('a1b2_');
  const writeBuildArtifact = jest.fn();
  const context = { writeBuildArtifact };
  let kept = true;
  skipStaleMapWrites({ buildDirectory, context, keyPrefix: 'a1b2_', isKeptContext: () => kept });

  await context.writeBuildArtifact('plugins/operators/serverJsMap.js', 'a');
  kept = false;
  await context.writeBuildArtifact('plugins/operators/serverJsMap.js', 'b');
  await context.writeBuildArtifact('plugins/operators/clientJsMap.js', 'b');
  await context.writeBuildArtifact('pages/home.json', '{}');

  expect(writeBuildArtifact.mock.calls).toEqual([
    ['plugins/operators/serverJsMap.js', 'a'],
    ['pages/home.json', '{}'],
  ]);
});

test('a page build started before a config rebuild does not write the JS maps', async () => {
  publishBuild('a1b2_');
  const writeBuildArtifact = jest.fn();
  const context = { writeBuildArtifact };
  skipStaleMapWrites({ buildDirectory, context, keyPrefix: 'a1b2_', isKeptContext: () => true });

  publishBuild('c3d4_');
  await context.writeBuildArtifact('plugins/operators/serverJsMap.js', 'a');

  expect(writeBuildArtifact.mock.calls).toEqual([]);
});
