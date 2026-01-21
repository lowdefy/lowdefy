/*
  Copyright 2020-2024 Lowdefy, Inc

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

const mockReadConfigFile = jest.fn();

jest.unstable_mockModule('../../utils/readConfigFile.js', () => ({
  default: () => mockReadConfigFile,
}));

const { default: getConfigFile } = await import('./getConfigFile.js');

const context = {
  directories: {
    config: '/test/config',
  },
  readConfigFile: mockReadConfigFile,
};

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getConfigFile returns file content when file exists', async () => {
  mockReadConfigFile.mockResolvedValue('file content');
  const refDef = { path: 'pages/home.yaml' };
  const result = await getConfigFile({ context, refDef, referencedFrom: 'lowdefy.yaml' });
  expect(result).toBe('file content');
  expect(mockReadConfigFile).toHaveBeenCalledWith('pages/home.yaml');
});

test('getConfigFile throws error when path is not a string', async () => {
  const refDef = { path: null, original: { path: null } };
  await expect(
    getConfigFile({ context, refDef, referencedFrom: 'lowdefy.yaml' })
  ).rejects.toThrow('Invalid _ref definition');
});

test('getConfigFile throws formatted error when file does not exist', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: 'missing.yaml', lineNumber: 10 };

  await expect(
    getConfigFile({ context, refDef, referencedFrom: 'lowdefy.yaml' })
  ).rejects.toThrow('[Config Error] Referenced file does not exist: "missing.yaml"');
});

test('getConfigFile error includes line number when available', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: 'missing.yaml', lineNumber: 25 };

  await expect(
    getConfigFile({ context, refDef, referencedFrom: 'pages/home.yaml' })
  ).rejects.toThrow('pages/home.yaml:25');
});

test('getConfigFile error shows resolved absolute path', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: 'missing.yaml' };

  await expect(
    getConfigFile({ context, refDef, referencedFrom: 'lowdefy.yaml' })
  ).rejects.toThrow('Resolved to: /test/config/missing.yaml');
});

test('getConfigFile suggests correct path for ../ prefix', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: '../filters/productFilter.yaml', lineNumber: 16 };

  const errorPromise = getConfigFile({
    context,
    refDef,
    referencedFrom: 'pages/products.yaml',
  });

  await expect(errorPromise).rejects.toThrow('Paths in _ref are resolved from config root');
  await expect(errorPromise).rejects.toThrow('Did you mean "filters/productFilter.yaml"?');
});

test('getConfigFile suggests correct path for multiple ../ prefixes', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: '../../shared/template.yaml' };

  const errorPromise = getConfigFile({ context, refDef, referencedFrom: 'pages/about.yaml' });

  await expect(errorPromise).rejects.toThrow('Did you mean "shared/template.yaml"?');
});

test('getConfigFile suggests correct path for ./ prefix', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: './components/header.yaml', lineNumber: 5 };

  const errorPromise = getConfigFile({ context, refDef, referencedFrom: 'pages/home.yaml' });

  await expect(errorPromise).rejects.toThrow('Remove "./" prefix');
  await expect(errorPromise).rejects.toThrow('Did you mean "components/header.yaml"?');
});

test('getConfigFile does not suggest path for normal paths', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: 'filters/productFilter.yaml' };

  const errorPromise = getConfigFile({ context, refDef, referencedFrom: 'pages/home.yaml' });

  await expect(errorPromise).rejects.toThrow('Referenced file does not exist');
  await expect(errorPromise).rejects.not.toThrow('Did you mean');
  await expect(errorPromise).rejects.not.toThrow('Tip:');
});

test('getConfigFile includes all error details in message', async () => {
  mockReadConfigFile.mockResolvedValue(null);
  const refDef = { path: '../missing.yaml', lineNumber: 42 };

  try {
    await getConfigFile({ context, refDef, referencedFrom: 'pages/test.yaml' });
    throw new Error('Expected error to be thrown');
  } catch (error) {
    expect(error.message).toContain('[Config Error]');
    expect(error.message).toContain('Referenced file does not exist: "../missing.yaml"');
    expect(error.message).toContain('pages/test.yaml:42');
    expect(error.message).toContain('Resolved to: /test/missing.yaml'); // path.resolve normalizes ../
    expect(error.message).toContain('Did you mean "missing.yaml"?');
  }
});
