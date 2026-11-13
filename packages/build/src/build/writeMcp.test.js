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

import { expect, test, vi } from 'vitest';

import testContext from '../test-utils/testContext.js';
import writeMcp from './writeMcp.js';

test('writeMcp writes mcp.json with the views the build collected', async () => {
  const writeBuildArtifact = vi.fn();
  const context = testContext({ writeBuildArtifact });
  context.mcpViews = {
    configured: true,
    pages: {
      task: { endpoints: [{ id: 'open_task', scope: 'mcp:read' }], websockets: [], agents: [] },
    },
    sources: ['https://files.example.com'],
  };
  const components = {
    mcp: { name: 'lowdefy', version: '1.0.0', endpoints: [], configured: false },
  };
  await writeMcp({ components, context });
  expect(writeBuildArtifact.mock.calls).toHaveLength(1);
  const [name, content] = writeBuildArtifact.mock.calls[0];
  expect(name).toBe('mcp.json');
  expect(JSON.parse(content)).toEqual({
    name: 'lowdefy',
    version: '1.0.0',
    endpoints: [],
    configured: false,
    views: {
      configured: true,
      pages: {
        task: { endpoints: [{ id: 'open_task', scope: 'mcp:read' }], websockets: [], agents: [] },
      },
      sources: ['https://files.example.com'],
    },
  });
});
