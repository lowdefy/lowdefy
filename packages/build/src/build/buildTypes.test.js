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

import { ConfigError } from '@lowdefy/errors';

import basicTypes from '@lowdefy/blocks-basic/types';
import loaderTypes from '@lowdefy/blocks-loaders/types';

import buildTypes from './buildTypes.js';
import testContext from '../test-utils/testContext.js';

// buildTypes always registers mandatory framework types (form validation
// operators, basic/loader blocks, the dark mode action) before resolving
// app-defined types, so every fixture typesMap must define them too.
function createDefinitions(typeNames) {
  const definitions = {};
  typeNames.forEach((typeName) => {
    definitions[typeName] = { package: 'mandatory-package' };
  });
  return definitions;
}

function createTypesMapContext(overrides = {}) {
  const context = testContext();
  context.typesMap = {
    actions: createDefinitions(['SetDarkMode']),
    agents: {},
    auth: { adapters: {}, providers: {}, strategies: {} },
    blocks: createDefinitions([...basicTypes.blocks, ...loaderTypes.blocks, 'Message']),
    connections: {},
    notifications: {},
    requests: {},
    steps: {},
    websockets: {},
    operators: { client: createDefinitions(['_not', '_type']), server: {} },
    ...overrides,
  };
  return context;
}

test('buildTypes resolves a step type defined in typesMap.steps', () => {
  const context = createTypesMapContext({
    steps: {
      BanUser: { package: '@lowdefy/plugin-better-auth', version: '1.0.0' },
    },
  });
  context.typeCounters.steps.increment('BanUser', 'configKey1');
  const components = {};
  buildTypes({ components, context });
  expect(components.types.steps).toEqual({
    BanUser: {
      originalTypeName: 'BanUser',
      package: '@lowdefy/plugin-better-auth',
      version: '1.0.0',
      count: 1,
    },
  });
});

test('buildTypes throws when a step type is used but not defined', () => {
  const context = createTypesMapContext();
  context.typeCounters.steps.increment('BanUser', 'configKey1');
  const components = {};
  expect(() => buildTypes({ components, context })).toThrow(
    'Step type "BanUser" was used but is not defined.'
  );
});

test('buildTypes does not require any step types to be used', () => {
  const context = createTypesMapContext();
  const components = {};
  expect(() => buildTypes({ components, context })).not.toThrow();
  expect(components.types.steps).toEqual({});
});

// These four names belong to steps and to nothing else - there is no action of
// any of them. Step and action types resolve from separate maps against
// separate counters, so a routine using them builds while the same name
// authored as an action fails as an undefined action type.
test('buildTypes resolves the organization step types that no action type shares', () => {
  const stepTypeNames = ['CancelInvitation', 'InviteMember', 'RemoveMember', 'UpdateOrganization'];
  const context = createTypesMapContext({ steps: createDefinitions(stepTypeNames) });
  stepTypeNames.forEach((typeName) => context.typeCounters.steps.increment(typeName, 'configKey1'));
  const components = {};
  expect(() => buildTypes({ components, context })).not.toThrow();
  expect(Object.keys(components.types.steps)).toEqual(stepTypeNames);
  stepTypeNames.forEach((typeName) => {
    expect(components.types.actions[typeName]).toBeUndefined();
  });
});

test('buildTypes collects an error for an unknown client operator', () => {
  const context = createTypesMapContext({
    operators: { client: createDefinitions(['_not', '_type', '_state']), server: {} },
  });
  context.errors = [];
  context.typeCounters.operators.client.increment('_stat', 'configKey1');
  const components = {};
  buildTypes({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toEqual(
    'Operator type "_stat" was used but is not defined. Did you mean "_state"?'
  );
  expect(context.errors[0].checkSlug).toEqual('operator-types');
  expect(context.errors[0].configKey).toEqual('configKey1');
  expect(components.types.operators.client._stat).toBeUndefined();
});

test('buildTypes collects an error for an unknown server operator', () => {
  const context = createTypesMapContext({
    operators: {
      client: createDefinitions(['_not', '_type']),
      server: createDefinitions(['_secret']),
    },
  });
  context.errors = [];
  context.typeCounters.operators.server.increment('_secrt', 'configKey1');
  const components = {};
  buildTypes({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toEqual(
    'Operator type "_secrt" was used but is not defined. Did you mean "_secret"?'
  );
  expect(context.errors[0].checkSlug).toEqual('operator-types');
});

test('buildTypes does not suppress an unknown operator under a sibling type slug', () => {
  const context = createTypesMapContext({
    operators: { client: createDefinitions(['_not', '_type', '_state']), server: {} },
  });
  context.errors = [];
  context.keyMap = {
    configKey1: { '~k_parent': 'blockKey' },
    blockKey: { '~ignoreBuildChecks': ['block-types'] },
  };
  context.typeCounters.operators.client.increment('_stat', 'configKey1');
  buildTypes({ components: {}, context });
  expect(context.errors).toHaveLength(1);
});

test('buildTypes reports every unknown type in one build', () => {
  const context = createTypesMapContext({
    operators: { client: createDefinitions(['_not', '_type', '_state']), server: {} },
  });
  context.errors = [];
  context.typeCounters.operators.client.increment('_stat', 'configKey1');
  context.typeCounters.operators.client.increment('_ifNot', 'configKey2');
  const components = {};
  buildTypes({ components, context });
  expect(context.errors).toHaveLength(2);
  expect(context.errors.map((error) => error.configKey)).toEqual(['configKey1', 'configKey2']);
});

test('buildTypes suppresses an unknown operator under ~ignoreBuildChecks operator-types', () => {
  const context = createTypesMapContext({
    operators: { client: createDefinitions(['_not', '_type', '_state']), server: {} },
  });
  context.errors = [];
  context.keyMap = {
    configKey1: { '~k_parent': 'blockKey' },
    blockKey: { '~ignoreBuildChecks': ['operator-types'] },
  };
  context.typeCounters.operators.client.increment('_stat', 'configKey1');
  const components = {};
  buildTypes({ components, context });
  expect(context.errors).toEqual([]);
});

test('buildTypes collects the file-plugin collisions found while the typesMap was assembled', () => {
  const context = createTypesMapContext();
  context.errors = [];
  context.filePluginExceptions = [
    new ConfigError(
      'Block type "Card" is defined by plugins/blocks/Card.jsx and by @lowdefy/blocks-antd.',
      { filePath: 'plugins/blocks/Card.jsx', lineNumber: 1, checkSlug: 'block-types' }
    ),
    new ConfigError(
      'Operator type "_slug" is defined by plugins/operators/client/_slug.js and by plugins/operators/shared/_slug.js.',
      { filePath: 'plugins/operators/client/_slug.js', lineNumber: 1, checkSlug: 'operator-types' }
    ),
  ];
  const components = {};
  buildTypes({ components, context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Block type "Card" is defined by plugins/blocks/Card.jsx and by @lowdefy/blocks-antd.',
    'Operator type "_slug" is defined by plugins/operators/client/_slug.js and by plugins/operators/shared/_slug.js.',
  ]);
  expect(context.errors[0].checkSlug).toEqual('block-types');
  expect(context.errors[1].checkSlug).toEqual('operator-types');
});

test('buildTypes carries the file and relative path of a file plugin into components.types', () => {
  const context = createTypesMapContext({
    blocks: {
      ...createDefinitions([...basicTypes.blocks, ...loaderTypes.blocks, 'Message']),
      Panel: {
        package: null,
        packageId: 'file-plugin',
        originalTypeName: 'Panel',
        version: null,
        file: '/app/plugins/blocks/Panel.jsx',
        relativePath: 'plugins/blocks/Panel.jsx',
      },
    },
  });
  context.typeCounters.blocks.increment('Panel', 'configKey1');
  const components = {};
  buildTypes({ components, context });
  expect(components.types.blocks.Panel).toEqual({
    originalTypeName: 'Panel',
    package: null,
    version: null,
    count: 1,
    packageId: 'file-plugin',
    file: '/app/plugins/blocks/Panel.jsx',
    relativePath: 'plugins/blocks/Panel.jsx',
  });
});
