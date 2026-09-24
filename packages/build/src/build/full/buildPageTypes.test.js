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

import createCounter from '../../utils/createCounter.js';
import mandatoryClientTypes from '../mandatoryClientTypes.js';
import buildPageTypes from './buildPageTypes.js';

function definitions(names, pkg) {
  return Object.fromEntries(
    names.map((name) => [name, { originalTypeName: name, package: pkg, version: '1.0.0' }])
  );
}

function pageCounters({ actions = [], blocks = [], operators = [] }) {
  const counters = {
    actions: createCounter(),
    blocks: createCounter(),
    operators: createCounter(),
  };
  actions.forEach((name) => counters.actions.increment(name));
  blocks.forEach((name) => counters.blocks.increment(name));
  operators.forEach((name) => counters.operators.increment(name));
  return counters;
}

function setup(pages) {
  const components = {
    pages: pages.map(({ pageId }) => ({ pageId })),
    types: {
      actions: definitions([...mandatoryClientTypes.actions, 'SetState'], '@lowdefy/actions-core'),
      blocks: definitions(
        [...mandatoryClientTypes.blocks, 'Button', 'Card'],
        '@lowdefy/blocks-antd'
      ),
      operators: {
        client: definitions([...mandatoryClientTypes.operators, '_state'], '@lowdefy/operators-js'),
        server: {},
      },
    },
  };
  const context = {
    pageTypeCounters: new Map(pages.map(({ pageId, used }) => [pageId, pageCounters(used)])),
  };
  buildPageTypes({ components, context });
  return components;
}

test('buildPageTypes adds the mandatory client types to every page', () => {
  const components = setup([{ pageId: 'home', used: {} }]);
  expect(components.pageTypeSets.home).toEqual({
    actions: [...mandatoryClientTypes.actions].sort(),
    blocks: [...mandatoryClientTypes.blocks].sort(),
    operators: [...mandatoryClientTypes.operators].sort(),
  });
});

test('buildPageTypes gives pages with the same type set one shared key', () => {
  const components = setup([
    { pageId: 'a', used: { blocks: ['Button', 'Card'], operators: ['_state'] } },
    { pageId: 'b', used: { blocks: ['Card', 'Button'], operators: ['_state'] } },
    { pageId: 'c', used: { blocks: ['Button'] } },
  ]);
  const [a, b, c] = components.pages;
  expect(a.typesKey).toEqual(b.typesKey);
  expect(a.typesKey).not.toEqual(c.typesKey);
  expect(Object.keys(components.pageTypes).sort()).toEqual([a.typesKey, c.typesKey].sort());
  expect(a.typesKey).toMatch(/^[0-9a-f]{12}$/);
});

test('buildPageTypes lists the imports for each type set', () => {
  const components = setup([
    { pageId: 'home', used: { actions: ['SetState'], blocks: ['Button'], operators: ['_state'] } },
  ]);
  const imports = components.pageTypes[components.pages[0].typesKey];
  expect(imports.blocks).toContainEqual({
    originalTypeName: 'Button',
    package: '@lowdefy/blocks-antd',
    typeName: 'Button',
  });
  expect(imports.actions.map((entry) => entry.typeName)).toEqual(['SetDarkMode', 'SetState']);
  expect(imports.operators.map((entry) => entry.typeName)).toEqual(['_not', '_state', '_type']);
});

test('buildPageTypes skips counted operators that are not installed, like the app barrel', () => {
  const components = setup([{ pageId: 'home', used: { operators: ['_state', '_notInstalled'] } }]);
  expect(components.pageTypeSets.home.operators).toEqual(['_not', '_state', '_type']);
});

test('buildPageTypes keys never contain page ids', () => {
  const components = setup([{ pageId: 'secret-admin-page', used: {} }]);
  expect(JSON.stringify(Object.keys(components.pageTypes))).not.toContain('secret-admin-page');
});
