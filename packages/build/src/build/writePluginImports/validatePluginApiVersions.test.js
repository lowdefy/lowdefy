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

jest.unstable_mockModule('./readPluginPackageJson.js', () => ({
  default: jest.fn(),
}));

const { default: readPluginPackageJson } = await import('./readPluginPackageJson.js');
const { default: validatePluginApiVersions } = await import('./validatePluginApiVersions.js');

function createContext({ filePlugins = [] } = {}) {
  return { errors: [], handleWarning: jest.fn(), filePlugins };
}

const components = {
  imports: {
    blocks: [{ package: '@acme/blocks', typeName: 'AcmeCard' }],
    actions: [{ package: '@acme/actions', typeName: 'AcmeDo' }],
    connections: [],
    operators: { client: [{ package: '@acme/blocks', typeName: '_acme' }], server: [] },
  },
};

test('validatePluginApiVersions accepts a package declaring the framework plugin API version', () => {
  readPluginPackageJson.mockImplementation(({ packageName }) => ({
    name: packageName,
    lowdefy: { pluginApiVersion: 1 },
  }));
  const context = createContext();
  validatePluginApiVersions({ components, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validatePluginApiVersions reads each plugin package once, in a stable order', () => {
  readPluginPackageJson.mockImplementation(({ packageName }) => ({
    name: packageName,
    lowdefy: { pluginApiVersion: 1 },
  }));
  validatePluginApiVersions({ components, context: createContext() });
  expect(readPluginPackageJson.mock.calls.map(([args]) => args.packageName)).toEqual([
    '@acme/actions',
    '@acme/blocks',
  ]);
});

test('validatePluginApiVersions errors naming the migration doc when a package declares another version', () => {
  readPluginPackageJson.mockImplementation(({ packageName }) => ({
    name: packageName,
    lowdefy: { pluginApiVersion: packageName === '@acme/blocks' ? 2 : 1 },
  }));
  const context = createContext();
  validatePluginApiVersions({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('"@acme/blocks" was built for plugin API v2');
  expect(context.errors[0].message).toContain('this Lowdefy version implements v1');
  expect(context.errors[0].message).toContain('plugin-api-versioning');
  expect(context.errors[0].received).toEqual({
    package: '@acme/blocks',
    pluginApiVersion: 2,
  });
});

test('validatePluginApiVersions warns rather than errors when a package declares nothing', () => {
  readPluginPackageJson.mockImplementation(({ packageName }) => ({ name: packageName }));
  const context = createContext();
  validatePluginApiVersions({ components, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).toHaveBeenCalledTimes(2);
  expect(context.handleWarning.mock.calls[0][0].message).toContain(
    '"@acme/actions" does not declare a plugin API version'
  );
  expect(context.handleWarning.mock.calls[0][0].message).toContain('"pluginApiVersion": 1');
});

test('validatePluginApiVersions treats a file plugin that declares nothing as the current version', () => {
  readPluginPackageJson.mockImplementation(() => null);
  const context = createContext({
    filePlugins: [{ relativePath: 'plugins/blocks/Card.jsx', kind: 'blocks' }],
  });
  validatePluginApiVersions({ components, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validatePluginApiVersions errors on a file plugin declaring another version, located at its file', () => {
  readPluginPackageJson.mockImplementation(() => null);
  const context = createContext({
    filePlugins: [{ relativePath: 'plugins/blocks/Card.jsx', kind: 'blocks', pluginApiVersion: 2 }],
  });
  validatePluginApiVersions({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain(
    'File plugin "plugins/blocks/Card.jsx" was built for plugin API v2'
  );
  expect(context.errors[0].message).toContain('this Lowdefy version implements v1');
  expect(context.errors[0].message).toContain('plugin-api-versioning');
  expect(context.errors[0].filePath).toBe('plugins/blocks/Card.jsx');
  expect(context.errors[0].checkSlug).toBe('plugin-api-version');
});

test('validatePluginApiVersions reports a shared file operator once, not once per kind', () => {
  readPluginPackageJson.mockImplementation(() => null);
  const record = { relativePath: 'plugins/operators/shared/_titleCase.js', pluginApiVersion: 99 };
  const context = createContext({
    filePlugins: [
      { ...record, kind: 'operators.client' },
      { ...record, kind: 'operators.server' },
    ],
  });
  validatePluginApiVersions({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('validatePluginApiVersions skips a package that is not installed yet', () => {
  readPluginPackageJson.mockImplementation(() => null);
  const context = createContext();
  validatePluginApiVersions({ components, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});
