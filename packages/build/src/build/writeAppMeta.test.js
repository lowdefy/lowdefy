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

import writeAppMeta from './writeAppMeta.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = vi.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeAppMeta', async () => {
  const components = {
    appMeta: {
      slug: 'my-app',
      name: 'My App',
      version: '1.0.0',
      description: 'A useful app.',
      license: 'MIT',
      lowdefyVersion: '5.0.0',
      gitSha: 'abc123',
    },
  };
  await writeAppMeta({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'appMeta.json',
      '{"slug":"my-app","name":"My App","version":"1.0.0","description":"A useful app.","license":"MIT","lowdefyVersion":"5.0.0","gitSha":"abc123"}',
    ],
  ]);
});
