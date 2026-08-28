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
import { serializer } from '@lowdefy/helpers';

import writeOverlay from './writeOverlay.js';

test('persists overlay blocks and exclude as overlay.json', async () => {
  const writeBuildArtifact = jest.fn();
  const context = {
    writeBuildArtifact,
    overlayBlocks: [{ id: 'dev_tools', type: 'Box' }],
    overlayExclude: new Set(['login']),
  };
  await writeOverlay({ context });
  expect(writeBuildArtifact).toHaveBeenCalledTimes(1);
  const [name, content] = writeBuildArtifact.mock.calls[0];
  expect(name).toBe('overlay.json');
  expect(serializer.deserializeFromString(content)).toEqual({
    blocks: [{ id: 'dev_tools', type: 'Box' }],
    exclude: ['login'],
  });
});

test('writes empty overlay when context has none', async () => {
  const writeBuildArtifact = jest.fn();
  const context = { writeBuildArtifact };
  await writeOverlay({ context });
  const [, content] = writeBuildArtifact.mock.calls[0];
  expect(serializer.deserializeFromString(content)).toEqual({
    blocks: [],
    exclude: [],
  });
});
