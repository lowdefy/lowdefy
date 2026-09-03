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

import buildComponents from './buildComponents.js';

function testContext({ blockMetas = {} } = {}) {
  // keyMap: buildComponents pre-keys the extracted defs (addKeys) so its
  // errors and expansion-time body errors carry config locations.
  return { componentDefs: {}, blockMetas, keyMap: {}, errors: [] };
}

test('registers a component definition by id', () => {
  const context = testContext();
  buildComponents({
    components: {
      components: [
        { id: 'Pill', props: { result: { type: 'string' } }, slots: ['footer'], blocks: [] },
      ],
    },
    context,
  });
  expect(context.componentDefs.Pill).toMatchObject({
    id: 'Pill',
    props: { result: { type: 'string' } },
    slots: ['footer'],
    blocks: [],
  });
});

test('deletes the components list from the tree', () => {
  const context = testContext();
  const components = { components: [{ id: 'Pill', blocks: [] }] };
  buildComponents({ components, context });
  expect(components.components).toBeUndefined();
});

test('does nothing when no components declared', () => {
  const context = testContext();
  expect(buildComponents({ components: {}, context })).toEqual({});
  expect(context.componentDefs).toEqual({});
});

test('throws on a duplicate component id', () => {
  const context = testContext();
  expect(() =>
    buildComponents({
      components: { components: [{ id: 'Pill', blocks: [] }, { id: 'Pill', blocks: [] }] },
      context,
    })
  ).toThrow('Duplicate component id "Pill"');
});

test('throws when a component type collides with an installed block type', () => {
  const context = testContext({ blockMetas: { Box: {} } });
  expect(() =>
    buildComponents({ components: { components: [{ id: 'Box', blocks: [] }] }, context })
  ).toThrow('collides with an installed block type');
});

test('throws when a component has no blocks', () => {
  const context = testContext();
  expect(() =>
    buildComponents({ components: { components: [{ id: 'Pill' }] }, context })
  ).toThrow('requires a blocks array');
});

test('throws when a component id is missing', () => {
  const context = testContext();
  expect(() =>
    buildComponents({ components: { components: [{ blocks: [] }] }, context })
  ).toThrow('Component id missing');
});

test('pre-keys extracted definitions so errors carry a config location', () => {
  const context = testContext();
  const component = { id: 'Pill', blocks: [{ id: 'label', type: 'Title' }] };
  buildComponents({ components: { components: [component] }, context });
  expect(context.componentDefs.Pill.configKey).toBeDefined();
  expect(context.keyMap[context.componentDefs.Pill.configKey]).toBeDefined();
  expect(context.componentDefs.Pill.blocks[0]['~k']).toBeDefined();
});
