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

import { jest } from '@jest/globals';

import writePluginChecksPending from './writePluginChecksPending.js';

test('writePluginChecksPending writes the pending packages', async () => {
  const writeBuildArtifact = jest.fn();
  await writePluginChecksPending({
    context: { writeBuildArtifact },
    packages: ['@lowdefy/a', '@lowdefy/b'],
  });
  expect(writeBuildArtifact.mock.calls).toEqual([
    [
      'plugin-checks-pending.json',
      JSON.stringify({ packages: ['@lowdefy/a', '@lowdefy/b'] }, null, 2),
    ],
  ]);
});

test('writePluginChecksPending writes nothing when no package is pending', async () => {
  const writeBuildArtifact = jest.fn();
  await writePluginChecksPending({ context: { writeBuildArtifact }, packages: [] });
  expect(writeBuildArtifact).not.toHaveBeenCalled();
});
