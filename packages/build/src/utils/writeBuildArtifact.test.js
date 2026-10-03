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

import path from 'path';

import { jest } from '@jest/globals';

jest.unstable_mockModule('@lowdefy/node-utils', () => {
  return {
    writeFileAtomic: jest.fn(),
    writeFileIfChanged: jest.fn(),
  };
});
const directories = { build: '/build' };

test('writeBuildArtifact writes content through writeFileIfChanged at the build path', async () => {
  const nodeUtils = await import('@lowdefy/node-utils');
  nodeUtils.writeFileIfChanged.mockImplementation(() => Promise.resolve(true));
  const createWriteBuildArtifact = (await import('./writeBuildArtifact.js')).default;

  const writeBuildArtifact = createWriteBuildArtifact({ directories });

  await writeBuildArtifact('artifact.txt', 'Test artifact content');
  expect(nodeUtils.writeFileIfChanged.mock.calls).toEqual([
    [path.join('/build', 'artifact.txt'), 'Test artifact content'],
  ]);
});

test('writeBuildArtifact writes through writeFileAtomic when atomic is set', async () => {
  const nodeUtils = await import('@lowdefy/node-utils');
  nodeUtils.writeFileAtomic.mockImplementation(() => Promise.resolve());
  nodeUtils.writeFileIfChanged.mockClear();
  const createWriteBuildArtifact = (await import('./writeBuildArtifact.js')).default;

  const writeBuildArtifact = createWriteBuildArtifact({ directories });

  await writeBuildArtifact('jitMaps/a-1-1.json', '{}', { atomic: true });
  expect(nodeUtils.writeFileAtomic.mock.calls).toEqual([['/build/jitMaps/a-1-1.json', '{}']]);
  expect(nodeUtils.writeFileIfChanged).not.toHaveBeenCalled();
});
