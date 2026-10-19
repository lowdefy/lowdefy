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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

const mockBuild = jest.fn();

jest.unstable_mockModule('@lowdefy/build', () => ({ default: mockBuild }));
jest.unstable_mockModule('./collectConfigText.mjs', () => ({
  default: jest.fn().mockResolvedValue({}),
}));
jest.unstable_mockModule('./prepareScratchServer.mjs', () => ({
  default: jest.fn().mockResolvedValue(),
}));
jest.unstable_mockModule('../../manager/utils/createCustomPluginTypesMap.mjs', () => ({
  default: jest.fn().mockResolvedValue({ customTypesMap: {}, customTypesMapMobile: {} }),
}));
jest.unstable_mockModule('../../manager/utils/createCustomPluginMessagesMap.mjs', () => ({
  default: jest.fn().mockResolvedValue({}),
}));

const { default: runConfigTreeBuild } = await import('./runConfigTreeBuild.mjs');

const logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };
let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-tree-skip-'));
  mockBuild.mockResolvedValue();
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('runConfigTreeBuild passes skipPluginChecks true to build', async () => {
  const result = await runConfigTreeBuild({
    configDirectory: path.join(root, 'app'),
    outDirectory: root,
    devDirectory: path.join(root, 'dev'),
    logger,
    skipPluginChecks: true,
  });
  expect(result).toEqual({ status: 'ok', errors: [], warnings: [] });
  const [args] = mockBuild.mock.calls[0];
  expect(args.skipPluginChecks).toBe(true);
  expect(args.stage).toEqual('dev');
});

test('runConfigTreeBuild passes skipPluginChecks undefined to build when not given', async () => {
  await runConfigTreeBuild({
    configDirectory: path.join(root, 'app'),
    outDirectory: root,
    devDirectory: path.join(root, 'dev'),
    logger,
  });
  expect(mockBuild.mock.calls[0][0].skipPluginChecks).toBeUndefined();
});
