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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { jest } from '@jest/globals';

import setupTestFixtures from './setupTestFixtures.mjs';

const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

// An app served under a basePath: lowdefy_run_journey must hand it to the
// runner, which counts calls and app errors under it.
jest.unstable_mockModule('../build/config.js', () => ({ default: { basePath: '/app' } }));
const mockRunJourney = jest.fn();
jest.unstable_mockModule('./runJourney.js', () => ({ default: mockRunJourney }));

const { default: createDocsMcpServer } = await import('./createDocsMcpServer.js');

async function connectClient() {
  const server = createDocsMcpServer({ origin: 'http://localhost:3000', version: '7.2.0' });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRunJourney.mockResolvedValue({ pageId: 'ticket', passed: true, steps: [], screenshots: [] });
});

test('MCP lowdefy_run_journey passes pathParams and the basePath to every run of a user list', async () => {
  const client = await connectClient();

  await client.callTool({
    name: 'lowdefy_run_journey',
    arguments: {
      pageId: 'ticket',
      pathParams: { ticket_id: 't1' },
      steps: [],
      data: 'crm',
      user: ['admin', 'member'],
    },
  });

  expect(mockRunJourney).toHaveBeenCalledTimes(2);
  mockRunJourney.mock.calls.forEach(([params]) => {
    expect(params).toEqual(
      expect.objectContaining({
        pageId: 'ticket',
        pathParams: { ticket_id: 't1' },
        data: 'crm',
        basePath: '/app',
      })
    );
  });
  await client.close();
});

test('MCP lowdefy_run_journey passes pathParams and the basePath to a single run', async () => {
  const client = await connectClient();

  await client.callTool({
    name: 'lowdefy_run_journey',
    arguments: { pageId: 'ticket', pathParams: { ticket_id: 't1' }, steps: [] },
  });

  expect(mockRunJourney).toHaveBeenCalledWith(
    expect.objectContaining({ pathParams: { ticket_id: 't1' }, basePath: '/app' })
  );
  await client.close();
});
