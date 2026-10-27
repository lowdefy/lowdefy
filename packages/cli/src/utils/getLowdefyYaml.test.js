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

import { vi, expect, test } from 'vitest';
import path from 'path';

class MockConfigError extends Error {
  constructor({ message, error, filePath, received }) {
    const finalMessage =
      error instanceof Error ? `Could not parse YAML. ${error.message}` : message;
    super(finalMessage);
    this.name = 'ConfigError';
    this.received = received;
  }
}

const { collectPluginDefinitions } = await import('@lowdefy/node-utils');
vi.doMock('@lowdefy/node-utils', () => {
  return {
    collectPluginDefinitions,
    readFile: vi.fn(),
    ConfigError: MockConfigError,
  };
});

const configDirectory = process.cwd();

test('get version from yaml file', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
      `;
    }
    return null;
  });
  const config = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true });
  expect(config).toEqual({
    experimental: {},
    lowdefyVersion: '1.0.0',
    cliConfig: {},
    plugins: [],
  });
});

test('get version from yaml file, config dir specified', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'configDir/lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
      `;
    }
    return null;
  });
  const config = await getLowdefyYaml({
    configDirectory: path.resolve(process.cwd(), './configDir'),
    requiresLowdefyYaml: true,
  });
  expect(config).toEqual({
    experimental: {},
    lowdefyVersion: '1.0.0',
    cliConfig: {},
    plugins: [],
  });
});

test('could not find lowdefy.yaml in cwd', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (
      filePath === path.resolve(process.cwd(), 'lowdefy.yaml') ||
      filePath === path.resolve(process.cwd(), 'lowdefy.yml')
    ) {
      return null;
    }
    return `
    lowdefy: 1.0.0
    `;
  });
  await expect(getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true })).rejects.toThrow(
    'Could not find "lowdefy.yaml" file in specified config directory'
  );
});

test('could not find lowdefy.yaml in config dir', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (
      filePath === path.resolve(process.cwd(), 'configDir/lowdefy.yaml') ||
      filePath === path.resolve(process.cwd(), 'configDir/lowdefy.yml')
    ) {
      return null;
    }
    return `
    lowdefy: 1.0.0
    `;
  });
  await expect(
    getLowdefyYaml({
      configDirectory: path.resolve(process.cwd(), './configDir'),
      requiresLowdefyYaml: true,
    })
  ).rejects.toThrow('Could not find "lowdefy.yaml" file in specified config directory');
});

test('lowdefy.yaml is invalid yaml', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
        - a: a
        b: b
      `;
    }
    return null;
  });
  await expect(getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true })).rejects.toThrow(
    'Could not parse YAML.'
  );
});

test('No version specified', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      pages:
        - id: page1
          type: Box
      `;
    }
    return null;
  });
  await expect(getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true })).rejects.toThrow(
    'No version specified in "lowdefy.yaml" file. Specify a version in the "lowdefy" field.'
  );
});

test('Version is not a string', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1
      `;
    }
    return null;
  });
  await expect(getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true })).rejects.toThrow(
    'Version number specified in "lowdefy.yaml" file should be a string.'
  );
});

test('get cliConfig', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
      cli:
        disableTelemetry: true
        watch:
          - a
      `;
    }
    return null;
  });
  const config = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true });
  expect(config).toEqual({
    experimental: {},
    lowdefyVersion: '1.0.0',
    cliConfig: { disableTelemetry: true, watch: ['a'] },
    plugins: [],
  });
});

test('get plugins', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
      plugins:
        - name: plugin1
          version: 1.0.0
          typePrefix: Plugin1
      `;
    }
    return null;
  });
  const config = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true });
  expect(config).toEqual({
    experimental: {},
    lowdefyVersion: '1.0.0',
    cliConfig: {},
    plugins: [{ name: 'plugin1', version: '1.0.0', typePrefix: 'Plugin1' }],
  });
});

test('could not find lowdefy.yaml in config dir, command is "init" or "clean-cache", , requiresLowdefyYaml is false', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation(() => null);
  const config = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: false });
  expect(config).toEqual({
    cliConfig: {},
  });
});

test('support yml extension', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yml')) {
      return `
      lowdefy: 1.0.0
      `;
    }
    return null;
  });
  const config = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true });
  expect(config).toEqual({
    experimental: {},
    lowdefyVersion: '1.0.0',
    cliConfig: {},
    plugins: [],
  });
});

test('get plugins lists a plugin in root and in two shells once, then shell-only plugins', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
      plugins:
        - name: '@example/lowdefy-printer'
          version: 2.1.0
      mobile:
        shells:
          - id: field
            plugins:
              - name: '@example/lowdefy-printer'
                version: 2.1.0
                typePrefix: Printer
              - name: '@example/lowdefy-mdm'
                version: 1.0.3
                options:
                  tenant: field-team
          - id: staging
            plugins:
              - name: '@example/lowdefy-printer'
                version: 2.1.0
                typePrefix: Printer
      `;
    }
    return null;
  });
  const config = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true });
  expect(config.plugins).toEqual([
    { name: '@example/lowdefy-printer', version: '2.1.0' },
    { name: '@example/lowdefy-mdm', version: '1.0.3', typePrefix: undefined, shellOnly: true },
  ]);
});

test('get plugins throws when a shell lists a plugin at another version than root', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      lowdefy: 1.0.0
      plugins:
        - name: '@example/lowdefy-printer'
          version: 2.1.0
      mobile:
        shells:
          - id: field
            plugins:
              - name: '@example/lowdefy-printer'
                version: 2.2.0
      `;
    }
    return null;
  });
  await expect(getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true })).rejects.toThrow(
    'Plugin "@example/lowdefy-printer" is listed at version "2.1.0" in root plugins and "2.2.0" in shell "field".'
  );
});

test('getLowdefyYaml reads the experimental opt-ins, or null when config is behind a _ref', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getLowdefyYaml } = await import('./getLowdefyYaml.js');
  readFile.mockImplementation((filePath) =>
    filePath === path.resolve(process.cwd(), 'lowdefy.yaml')
      ? 'lowdefy: 1.0.0\nconfig:\n  experimental:\n    mobile: true\n'
      : null
  );
  expect((await getLowdefyYaml({ configDirectory: process.cwd() })).experimental).toEqual({
    mobile: true,
  });
  readFile.mockImplementation((filePath) =>
    filePath === path.resolve(process.cwd(), 'lowdefy.yaml')
      ? 'lowdefy: 1.0.0\nconfig:\n  _ref: config.yaml\n'
      : null
  );
  expect((await getLowdefyYaml({ configDirectory: process.cwd() })).experimental).toBe(null);
});
