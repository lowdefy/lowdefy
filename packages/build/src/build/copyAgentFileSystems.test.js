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

const mockExistsSync = jest.fn();
const mockCopyFileOrDirectory = jest.fn();

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  copyFileOrDirectory: mockCopyFileOrDirectory,
}));

let copyAgentFileSystems;

beforeAll(async () => {
  copyAgentFileSystems = (await import('./copyAgentFileSystems.js')).default;
});

beforeEach(() => {
  mockExistsSync.mockReset();
  mockExistsSync.mockReturnValue(true);
  mockCopyFileOrDirectory.mockReset();
});

function createContext({ config = '/app', server = '/app/.lowdefy/server' } = {}) {
  return {
    directories: { config, server },
    writeBuildArtifact: jest.fn(),
  };
}

test('copyAgentFileSystems writes empty manifest when no agents are defined', async () => {
  const context = createContext();
  await copyAgentFileSystems({ components: {}, context });
  expect(context.writeBuildArtifact).toHaveBeenCalledWith('agentFileSystems.json', '[]');
  expect(mockCopyFileOrDirectory).not.toHaveBeenCalled();
});

test('copyAgentFileSystems writes empty manifest when no agent has fileSystem', async () => {
  const context = createContext();
  await copyAgentFileSystems({
    components: {
      agents: [{ id: 'agent_1', properties: {} }, { id: 'agent_2', properties: { model: 'foo' } }],
    },
    context,
  });
  expect(context.writeBuildArtifact).toHaveBeenCalledWith('agentFileSystems.json', '[]');
  expect(mockCopyFileOrDirectory).not.toHaveBeenCalled();
});

test('copyAgentFileSystems deduplicates basePaths shared across agents', async () => {
  const context = createContext();
  await copyAgentFileSystems({
    components: {
      agents: [
        { id: 'a1', properties: { fileSystem: { basePath: './content' } } },
        { id: 'a2', properties: { fileSystem: { basePath: './content' } } },
        { id: 'a3', properties: { fileSystem: { basePath: './data' } } },
      ],
    },
    context,
  });
  expect(context.writeBuildArtifact).toHaveBeenCalledWith(
    'agentFileSystems.json',
    JSON.stringify(['./content', './data'])
  );
  expect(mockCopyFileOrDirectory).toHaveBeenCalledTimes(2);
});

test('copyAgentFileSystems skips agents whose basePath is not a string', async () => {
  const context = createContext();
  await copyAgentFileSystems({
    components: {
      agents: [
        { id: 'a1', properties: { fileSystem: { basePath: 123 } } },
        { id: 'a2', properties: { fileSystem: { basePath: null } } },
        { id: 'a3', properties: { fileSystem: { basePath: './content' } } },
      ],
    },
    context,
  });
  expect(context.writeBuildArtifact).toHaveBeenCalledWith(
    'agentFileSystems.json',
    JSON.stringify(['./content'])
  );
});

test('copyAgentFileSystems writes manifest even when config and server directories match', async () => {
  const context = createContext({ config: '/app', server: '/app' });
  await copyAgentFileSystems({
    components: {
      agents: [{ id: 'a1', properties: { fileSystem: { basePath: './content' } } }],
    },
    context,
  });
  expect(context.writeBuildArtifact).toHaveBeenCalledWith(
    'agentFileSystems.json',
    JSON.stringify(['./content'])
  );
  // No copy needed when source and destination directories are the same.
  expect(mockCopyFileOrDirectory).not.toHaveBeenCalled();
});

test('copyAgentFileSystems copies each basePath from config to server directory', async () => {
  const context = createContext({ config: '/app', server: '/app/.lowdefy/server' });
  await copyAgentFileSystems({
    components: {
      agents: [{ id: 'a1', properties: { fileSystem: { basePath: './content' } } }],
    },
    context,
  });
  expect(mockCopyFileOrDirectory).toHaveBeenCalledWith(
    '/app/content',
    '/app/.lowdefy/server/content'
  );
});

test('copyAgentFileSystems skips copying when source basePath does not exist', async () => {
  mockExistsSync.mockReturnValue(false);
  const context = createContext();
  await copyAgentFileSystems({
    components: {
      agents: [{ id: 'a1', properties: { fileSystem: { basePath: './missing' } } }],
    },
    context,
  });
  expect(context.writeBuildArtifact).toHaveBeenCalledWith(
    'agentFileSystems.json',
    JSON.stringify(['./missing'])
  );
  expect(mockCopyFileOrDirectory).not.toHaveBeenCalled();
});

test('copyAgentFileSystems wraps copy errors with the failing basePath', async () => {
  mockCopyFileOrDirectory.mockRejectedValueOnce(new Error('disk full'));
  const context = createContext();
  await expect(
    copyAgentFileSystems({
      components: {
        agents: [{ id: 'a1', properties: { fileSystem: { basePath: './content' } } }],
      },
      context,
    })
  ).rejects.toThrow(
    'Failed to copy fileSystem basePath "./content" to server directory: disk full'
  );
});
