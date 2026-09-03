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
  const warnings = [];
  return {
    componentDefs: {},
    blockMetas,
    keyMap: {},
    errors: [],
    warnings,
    handleWarning: (warning) => warnings.push(warning),
  };
}

test('buildComponents registers a component definition keyed by the map key', () => {
  const context = testContext();
  buildComponents({
    components: {
      components: {
        Pill: { props: { result: { type: 'string' } }, slots: ['footer'], blocks: [] },
      },
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

test('buildComponents accepts the deprecated array form with a warning', () => {
  const context = testContext();
  buildComponents({
    components: { components: [{ id: 'Pill', blocks: [] }] },
    context,
  });
  expect(context.componentDefs.Pill).toMatchObject({ id: 'Pill', blocks: [] });
  expect(context.warnings[0].message).toMatch(
    'App "components" as an array is deprecated. Declare components as a map keyed by component id.'
  );
});

test('buildComponents throws when a map entry declares a different id', () => {
  const context = testContext();
  expect(() =>
    buildComponents({ components: { components: { Pill: { id: 'Tag', blocks: [] } } }, context })
  ).toThrow('Component "Pill" declares a different id "Tag"');
});

test('buildComponents deletes the components list from the tree', () => {
  const context = testContext();
  const components = { components: { Pill: { blocks: [] } } };
  buildComponents({ components, context });
  expect(components.components).toBeUndefined();
});

test('buildComponents does nothing when no components declared', () => {
  const context = testContext();
  expect(buildComponents({ components: {}, context })).toEqual({});
  expect(context.componentDefs).toEqual({});
});

test('buildComponents throws on a duplicate component id in the array form', () => {
  const context = testContext();
  expect(() =>
    buildComponents({
      components: {
        components: [
          { id: 'Pill', blocks: [] },
          { id: 'Pill', blocks: [] },
        ],
      },
      context,
    })
  ).toThrow('Duplicate component id "Pill"');
});

test('buildComponents throws when a component type collides with an installed block type', () => {
  const context = testContext({ blockMetas: { Box: {} } });
  expect(() =>
    buildComponents({ components: { components: { Box: { blocks: [] } } }, context })
  ).toThrow('collides with an installed block type');
});

test('buildComponents throws when a component has no blocks', () => {
  const context = testContext();
  expect(() => buildComponents({ components: { components: { Pill: {} } }, context })).toThrow(
    'requires a blocks array'
  );
});

test('buildComponents throws when a component id is missing in the array form', () => {
  const context = testContext();
  expect(() => buildComponents({ components: { components: [{ blocks: [] }] }, context })).toThrow(
    'Component id missing'
  );
});

test('buildComponents throws when a prop definition is not an object', () => {
  const context = testContext();
  expect(() =>
    buildComponents({
      components: { components: { Pill: { props: { tone: 'string' }, blocks: [] } } },
      context,
    })
  ).toThrow('Component "Pill" prop "tone" should be an object');
});

test('buildComponents throws when a prop definition has an unknown key', () => {
  const context = testContext();
  expect(() =>
    buildComponents({
      components: { components: { Pill: { props: { tone: { typ: 'string' } }, blocks: [] } } },
      context,
    })
  ).toThrow('Component "Pill" prop "tone" has an unknown key "typ"');
});

test('buildComponents throws when a prop definition declares an unknown type', () => {
  const context = testContext();
  expect(() =>
    buildComponents({
      components: { components: { Pill: { props: { tone: { type: 'str' } }, blocks: [] } } },
      context,
    })
  ).toThrow('Component "Pill" prop "tone" type should be one of');
});

test('buildComponents throws when a prop definition required is not a boolean', () => {
  const context = testContext();
  expect(() =>
    buildComponents({
      components: { components: { Pill: { props: { tone: { required: 'yes' } }, blocks: [] } } },
      context,
    })
  ).toThrow('Component "Pill" prop "tone" required should be a boolean');
});

test('buildComponents pre-keys extracted definitions so errors carry a config location', () => {
  const context = testContext();
  const component = { blocks: [{ id: 'label', type: 'Title' }] };
  buildComponents({ components: { components: { Pill: component } }, context });
  expect(context.componentDefs.Pill.configKey).toBeDefined();
  expect(context.keyMap[context.componentDefs.Pill.configKey]).toBeDefined();
  expect(context.componentDefs.Pill.blocks[0]['~k']).toBeDefined();
});
