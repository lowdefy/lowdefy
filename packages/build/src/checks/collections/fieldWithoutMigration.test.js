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
import fieldWithoutMigration from './fieldWithoutMigration.js';

function testContext({ collections = {}, migrationSources = [] } = {}) {
  const warnings = [];
  return {
    warnings,
    collections,
    migrationSources,
    handleWarning: (warning) => warnings.push(warning),
  };
}

const collections = {
  frameworks: {
    configKey: 'k1',
    fields: {
      name: { type: 'string' },
      slug: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['name', 'slug'],
  },
};

test('fieldWithoutMigration is silent when the app declares no collections', () => {
  const context = testContext({ collections });
  fieldWithoutMigration.run({ components: {}, context });
  expect(context.warnings).toEqual([]);
});

test('fieldWithoutMigration warns once per required field no migration names', () => {
  const context = testContext({
    collections,
    migrationSources: [{ id: 'm1', text: 'routine:\n  - update: { $set: { slug: 1 } }\n' }],
  });
  fieldWithoutMigration.run({ components: { collections: {} }, context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toMatch(
    'declares field "name" as required, but no migration file names it'
  );
  expect(context.warnings[0].configKey).toBe('k1');
  expect(context.warnings[0].checkSlug).toBe('collections-field-migration');
});

test('fieldWithoutMigration is a check-only rule under the collections slug', () => {
  expect(fieldWithoutMigration.checkOnly).toBe(true);
  expect(fieldWithoutMigration.slug).toBe('collections-field-migration');
});
