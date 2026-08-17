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
const mockCompile = jest.fn();
const mockScan = jest.fn();
const mockBuild = jest.fn();

// Features is a bit-flag enum; Utilities must be a set bit so the guard passes.
const Features = { None: 0, Utilities: 1 };

class MockScanner {
  constructor(options) {
    this.options = options;
    this.scan = mockScan;
  }
}

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

jest.unstable_mockModule('@tailwindcss/node', () => ({
  compile: mockCompile,
  Features,
}));

jest.unstable_mockModule('@tailwindcss/oxide', () => ({
  Scanner: MockScanner,
}));

let writeReportStyles;

beforeAll(async () => {
  writeReportStyles = (await import('./writeReportStyles.js')).default;
});

beforeEach(() => {
  mockExistsSync.mockReset().mockReturnValue(false);
  mockScan.mockReset().mockReturnValue(['flex', 'text-red-500']);
  mockBuild.mockReset().mockReturnValue('/* compiled */ .flex{display:flex}');
  mockCompile.mockReset().mockResolvedValue({
    features: Features.Utilities,
    root: 'none',
    sources: [{ base: '/app/build', pattern: '../lowdefy-build/tailwind/*.html', negated: false }],
    build: mockBuild,
  });
});

function createContext() {
  return {
    directories: { config: '/app', build: '/app/build', server: '/app' },
    writeBuildArtifact: jest.fn(),
  };
}

test('compiles from the build directory and writes reports/styles.css', async () => {
  const context = createContext();
  await writeReportStyles({ components: {}, context });

  expect(mockCompile).toHaveBeenCalledTimes(1);
  const [inputCss, options] = mockCompile.mock.calls[0];
  expect(options.base).toBe('/app/build');
  expect(inputCss).toContain('@import "tailwindcss" source(none);');
  expect(inputCss).toContain('@source "../lowdefy-build/tailwind/*.html";');

  const [filePath, content] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('reports/styles.css');
  expect(content).toBe('/* compiled */ .flex{display:flex}');
});

test('omits the antd token bridge that globals.css carries', async () => {
  const context = createContext();
  await writeReportStyles({ components: { theme: { tailwind: {} } }, context });
  const inputCss = mockCompile.mock.calls[0][0];
  expect(inputCss).not.toContain('@theme inline');
  expect(inputCss).not.toContain('--ant-');
});

test('includes public/styles.css as a components-layer import when it exists', async () => {
  const context = createContext();
  mockExistsSync.mockReturnValue(true);
  await writeReportStyles({ components: {}, context });
  const inputCss = mockCompile.mock.calls[0][0];
  expect(inputCss).toContain('@import "../public/styles.css" layer(components);');
});

test('omits the user stylesheet import when public/styles.css is absent', async () => {
  const context = createContext();
  mockExistsSync.mockReturnValue(false);
  await writeReportStyles({ components: {}, context });
  const inputCss = mockCompile.mock.calls[0][0];
  expect(inputCss).not.toContain('public/styles.css');
});

test('scans the compiler sources and builds with the resulting candidates', async () => {
  const context = createContext();
  await writeReportStyles({ components: {}, context });
  expect(mockScan).toHaveBeenCalledTimes(1);
  expect(mockBuild).toHaveBeenCalledWith(['flex', 'text-red-500']);
});

test('skips scanning when the compiler reports no utilities feature', async () => {
  const context = createContext();
  mockCompile.mockResolvedValue({
    features: Features.None,
    root: 'none',
    sources: [],
    build: mockBuild,
  });
  await writeReportStyles({ components: {}, context });
  expect(mockScan).not.toHaveBeenCalled();
  expect(mockBuild).toHaveBeenCalledWith([]);
});
