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

import { vi, beforeEach, expect, test } from 'vitest';

import writeMaps from './writeMaps.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = vi.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeMaps', async () => {
  context.keyMap = {
    key: 'value',
  };
  context.refMap = {
    ref: 'value',
  };
  await writeMaps({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['keyMap.json', '{"key":"value"}'],
    ['refMap.json', '{"ref":"value"}'],
  ]);
});

test('writeMaps writes refMap ids in the same order whatever order refs resolved in', async () => {
  const entries = {
    'pages.0': { parent: '2', lineNumber: 1, path: 'pages/a.yaml' },
    'pages.0~1': { parent: 'pages.0', lineNumber: 1, path: 'templates/page.yaml' },
    'pages.1': { parent: '2', lineNumber: 2, path: 'pages/b.yaml' },
    'pages.0.blocks.0': { parent: 'pages.0~1', lineNumber: 5, path: 'blocks/header.yaml' },
  };
  const written = [];
  for (const order of [
    ['pages.0', 'pages.0~1', 'pages.1', 'pages.0.blocks.0'],
    ['pages.1', 'pages.0.blocks.0', 'pages.0', 'pages.0~1'],
  ]) {
    mockWriteBuildArtifact.mockReset();
    context.keyMap = {};
    context.refMap = {};
    for (const id of order) {
      context.refMap[id] = entries[id];
    }
    await writeMaps({ context });
    written.push(mockWriteBuildArtifact.mock.calls[1][1]);
  }
  expect(written[0]).toEqual(written[1]);
  expect(Object.keys(JSON.parse(written[0]))).toEqual([
    'pages.0',
    'pages.0.blocks.0',
    'pages.0~1',
    'pages.1',
  ]);
});

test('keyMap is not an object', async () => {
  const context = {
    keyMap: 'keyMap',
    refMap: {},
  };
  await expect(writeMaps({ context })).rejects.toThrow('keyMap is not an object.');
});

test('refMap is not an object', async () => {
  const context = {
    refMap: 'refMap',
    keyMap: {},
  };
  await expect(writeMaps({ context })).rejects.toThrow('refMap is not an object.');
});
