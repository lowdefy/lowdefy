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

import resolveCollectionField, { resolveCollection } from './resolveCollectionField.js';

const collections = {
  answers: {
    fields: {
      _id: { type: 'string' },
      test_id: { type: 'string' },
      result: { type: 'string', enum: ['pass', 'fail'] },
      created_at: { instanceof: 'Date' },
    },
    relations: { test_id: { collection: 'tests', field: '_id' } },
  },
  empty_collection: {},
};

const args = (fieldName) => ({
  collection: collections.answers,
  collectionName: 'answers',
  fieldName,
  archetype: 'ListPage',
  pageId: 'answers',
  configKey: 'k1',
});

test('resolveCollectionField resolves a string field with a humanised label', () => {
  const result = resolveCollectionField(args('test_id'));
  expect(result.label).toBe('Test');
  expect(result.dataType).toBe('string');
  expect(result.isEnum).toBe(false);
  expect(result.isRelation).toBe(true);
  expect(result.relation).toEqual({ collection: 'tests', field: '_id' });
});

test('resolveCollectionField flags an enum field with its values', () => {
  const result = resolveCollectionField(args('result'));
  expect(result.isEnum).toBe(true);
  expect(result.enumValues).toEqual(['pass', 'fail']);
});

test('resolveCollectionField reads a Date instanceof marker as dataType date', () => {
  const result = resolveCollectionField(args('created_at'));
  expect(result.dataType).toBe('date');
});

test('resolveCollectionField throws with a suggestion for an unknown field', () => {
  expect(() => resolveCollectionField(args('test_di'))).toThrow(
    /is not a field of collection "answers".*Did you mean "test_id"/s
  );
});

test('resolveCollectionField throws when the collection declares no fields', () => {
  expect(() =>
    resolveCollectionField({
      collection: collections.empty_collection,
      collectionName: 'empty_collection',
      fieldName: 'anything',
      archetype: 'ListPage',
      pageId: 'p',
      configKey: 'k1',
    })
  ).toThrow(/declares no fields/);
});

test('resolveCollection throws naming declared collections when absent', () => {
  expect(() =>
    resolveCollection({
      collections,
      collectionName: 'missing',
      archetype: 'ListPage',
      pageId: 'p',
      configKey: 'k1',
    })
  ).toThrow(/not declared in collections.*Declared collections: answers, empty_collection/s);
});

test('resolveCollection returns the collection when declared', () => {
  expect(
    resolveCollection({
      collections,
      collectionName: 'answers',
      archetype: 'ListPage',
      pageId: 'p',
      configKey: 'k1',
    })
  ).toBe(collections.answers);
});
