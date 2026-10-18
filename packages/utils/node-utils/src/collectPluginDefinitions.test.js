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

import collectPluginDefinitions from './collectPluginDefinitions.js';

test('collectPluginDefinitions returns root plugins unchanged when no shell lists plugins', () => {
  const lowdefy = {
    plugins: [{ name: '@example/web', version: '1.0.0', typePrefix: 'Web' }],
    mobile: { shells: [{ id: 'field', profile: 'field' }] },
  };
  expect(collectPluginDefinitions({ lowdefy })).toEqual({
    plugins: [{ name: '@example/web', version: '1.0.0', typePrefix: 'Web' }],
    shellPlugins: [],
  });
});

test('collectPluginDefinitions returns empty lists for an app without plugins or mobile', () => {
  expect(collectPluginDefinitions({ lowdefy: { lowdefy: '7.0.0' } })).toEqual({
    plugins: [],
    shellPlugins: [],
  });
  expect(collectPluginDefinitions({ lowdefy: null })).toEqual({ plugins: [], shellPlugins: [] });
});

test('collectPluginDefinitions lists a plugin in root and in two shells once', () => {
  const lowdefy = {
    plugins: [{ name: '@example/printer', version: '2.1.0', typePrefix: 'Web' }],
    mobile: {
      shells: [
        {
          id: 'field',
          plugins: [{ name: '@example/printer', version: '2.1.0', typePrefix: 'Printer' }],
        },
        {
          id: 'staging',
          plugins: [{ name: '@example/printer', version: '2.1.0', typePrefix: 'Printer' }],
        },
      ],
    },
  };
  expect(collectPluginDefinitions({ lowdefy })).toEqual({
    plugins: [{ name: '@example/printer', version: '2.1.0', typePrefix: 'Web' }],
    shellPlugins: [{ name: '@example/printer', version: '2.1.0', typePrefix: 'Printer' }],
  });
});

test('collectPluginDefinitions adds a shell-only plugin after root plugins', () => {
  const lowdefy = {
    plugins: [{ name: '@example/web', version: '1.0.0' }],
    mobile: {
      shells: [
        {
          id: 'field',
          plugins: [
            {
              name: '@example/mdm',
              version: '1.0.3',
              options: { tenant: 'field-team' },
            },
          ],
        },
      ],
    },
  };
  expect(collectPluginDefinitions({ lowdefy })).toEqual({
    plugins: [
      { name: '@example/web', version: '1.0.0' },
      { name: '@example/mdm', version: '1.0.3', typePrefix: undefined, shellOnly: true },
    ],
    shellPlugins: [{ name: '@example/mdm', version: '1.0.3', typePrefix: undefined }],
  });
});

test('collectPluginDefinitions throws when a shell lists another version than root plugins', () => {
  const lowdefy = {
    plugins: [{ name: '@example/printer', version: '2.1.0' }],
    mobile: {
      shells: [{ id: 'field', plugins: [{ name: '@example/printer', version: '2.2.0' }] }],
    },
  };
  expect(() => collectPluginDefinitions({ lowdefy })).toThrow(
    'Plugin "@example/printer" is listed at version "2.1.0" in root plugins and "2.2.0" in shell "field". The server installs one version of each plugin, so list the same version everywhere.'
  );
});

test('collectPluginDefinitions throws when two shells list different versions', () => {
  const lowdefy = {
    mobile: {
      shells: [
        { id: 'field', plugins: [{ name: '@example/printer', version: '2.1.0' }] },
        { id: 'staging', plugins: [{ name: '@example/printer', version: '2.2.0' }] },
      ],
    },
  };
  expect(() => collectPluginDefinitions({ lowdefy })).toThrow(
    'Plugin "@example/printer" is listed at version "2.1.0" in shell "field" and "2.2.0" in shell "staging".'
  );
});

test('collectPluginDefinitions throws when two shells give a plugin different typePrefixes', () => {
  const lowdefy = {
    mobile: {
      shells: [
        {
          id: 'field',
          plugins: [{ name: '@example/printer', version: '2.1.0', typePrefix: 'Printer' }],
        },
        { id: 'staging', plugins: [{ name: '@example/printer', version: '2.1.0' }] },
      ],
    },
  };
  expect(() => collectPluginDefinitions({ lowdefy })).toThrow(
    'Plugin "@example/printer" has typePrefix "Printer" in shell "field" and undefined in shell "staging". Every shell shares one set of native type names, so give the plugin the same typePrefix in every shell.'
  );
});

test('collectPluginDefinitions skips shell plugins the raw read cannot see', () => {
  const lowdefy = {
    mobile: {
      shells: [
        { id: 'field', plugins: { _ref: 'shell-plugins.yaml' } },
        { _ref: 'staging-shell.yaml' },
        { id: 'ops', plugins: [{ _ref: 'printer.yaml' }] },
      ],
    },
  };
  expect(collectPluginDefinitions({ lowdefy })).toEqual({ plugins: [], shellPlugins: [] });
  expect(
    collectPluginDefinitions({ lowdefy: { mobile: { shells: { _ref: 'shells.yaml' } } } })
  ).toEqual({ plugins: [], shellPlugins: [] });
  expect(collectPluginDefinitions({ lowdefy: { mobile: { _ref: 'mobile.yaml' } } })).toEqual({
    plugins: [],
    shellPlugins: [],
  });
});
