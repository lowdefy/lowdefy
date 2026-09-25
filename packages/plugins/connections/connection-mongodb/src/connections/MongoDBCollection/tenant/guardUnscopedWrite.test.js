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

import {
  assertUnscopedBulkOperations,
  assertUnscopedDoc,
  assertUnscopedUpdate,
} from './guardUnscopedWrite.js';

const field = 'organization_id';
const refusal = 'Unscoped write (tenant: none) on a tenant connection must leave "organization_id"';

describe('assertUnscopedDoc', () => {
  test('passes a document carrying an organization id', () => {
    expect(() =>
      assertUnscopedDoc({ doc: { organization_id: 'org_a', x: 1 }, field })
    ).not.toThrow();
  });

  test.each([
    ['null', { organization_id: null }],
    ['missing', { x: 1 }],
    ['empty string', { organization_id: '' }],
    ['a number', { organization_id: 7 }],
    ['an object', { organization_id: { id: 'org_a' } }],
  ])('refuses a document whose organization id is %s', (_, doc) => {
    expect(() => assertUnscopedDoc({ doc, field })).toThrow(refusal);
  });

  test('refuses a dotted write into the field', () => {
    expect(() =>
      assertUnscopedDoc({ doc: { organization_id: 'org_a', 'organization_id.x': 1 }, field })
    ).toThrow('dotted path "organization_id.x"');
  });

  test('names the position and the value in the error', () => {
    expect(() =>
      assertUnscopedDoc({ doc: { organization_id: null }, field, position: 'a replacement' })
    ).toThrow('a replacement carries null');
  });
});

describe('assertUnscopedUpdate - object form', () => {
  test('passes an update that does not touch the field', () => {
    expect(() =>
      assertUnscopedUpdate({ update: { $set: { title: 'x' } }, filter: {}, field })
    ).not.toThrow();
  });

  test('passes an update that sets a real organization id', () => {
    expect(() =>
      assertUnscopedUpdate({ update: { $set: { organization_id: 'org_a' } }, filter: {}, field })
    ).not.toThrow();
  });

  test('refuses setting the field to null', () => {
    expect(() =>
      assertUnscopedUpdate({ update: { $set: { organization_id: null } }, filter: {}, field })
    ).toThrow('an update $sets it to null');
  });

  test('refuses unsetting the field', () => {
    expect(() =>
      assertUnscopedUpdate({ update: { $unset: { organization_id: '' } }, filter: {}, field })
    ).toThrow('an update removes it');
  });

  test('refuses other operators on the field', () => {
    expect(() =>
      assertUnscopedUpdate({ update: { $inc: { organization_id: 1 } }, filter: {}, field })
    ).toThrow('an update applies $inc to it');
  });

  test('refuses renaming the field away or onto it', () => {
    expect(() =>
      assertUnscopedUpdate({ update: { $rename: { organization_id: 'old' } }, filter: {}, field })
    ).toThrow('an update removes it');
    expect(() =>
      assertUnscopedUpdate({ update: { $rename: { other: 'organization_id' } }, filter: {}, field })
    ).toThrow('can not verify');
  });

  test('refuses an upsert that would insert a row without the field', () => {
    expect(() =>
      assertUnscopedUpdate({
        update: { $set: { title: 'x' } },
        filter: { _id: 'a' },
        field,
        upsert: true,
      })
    ).toThrow('an update can upsert a row without it');
  });

  test('passes an upsert that authors the field in $setOnInsert', () => {
    expect(() =>
      assertUnscopedUpdate({
        update: { $setOnInsert: { organization_id: 'org_a' } },
        filter: { _id: 'a' },
        field,
        upsert: true,
      })
    ).not.toThrow();
  });

  test('passes an upsert that matches the field by equality in the filter', () => {
    expect(() =>
      assertUnscopedUpdate({
        update: { $set: { title: 'x' } },
        filter: { _id: 'a', organization_id: 'org_a' },
        field,
        upsert: true,
      })
    ).not.toThrow();
    expect(() =>
      assertUnscopedUpdate({
        update: { $set: { title: 'x' } },
        filter: { organization_id: { $eq: 'org_a' } },
        field,
        upsert: true,
      })
    ).not.toThrow();
  });

  test('refuses an upsert whose filter matches a null organization id', () => {
    expect(() =>
      assertUnscopedUpdate({
        update: { $set: { title: 'x' } },
        filter: { organization_id: null },
        field,
        upsert: true,
      })
    ).toThrow('an update can upsert a row without it');
  });
});

describe('assertUnscopedUpdate - pipeline form', () => {
  test('passes a pipeline that does not touch the field', () => {
    expect(() =>
      assertUnscopedUpdate({ update: [{ $set: { title: 'x' } }], filter: {}, field })
    ).not.toThrow();
  });

  test('refuses a pipeline that unsets the field', () => {
    expect(() =>
      assertUnscopedUpdate({ update: [{ $unset: ['organization_id'] }], filter: {}, field })
    ).toThrow('an update removes it');
  });

  test('refuses a field path expression - it can not be verified', () => {
    expect(() =>
      assertUnscopedUpdate({
        update: [{ $set: { organization_id: '$other' } }],
        filter: {},
        field,
      })
    ).toThrow('can not verify');
  });

  test('passes a $literal organization id', () => {
    expect(() =>
      assertUnscopedUpdate({
        update: [{ $set: { organization_id: { $literal: 'org_a' } } }],
        filter: {},
        field,
        upsert: true,
      })
    ).not.toThrow();
  });

  test('refuses a $replaceWith expression unless a later stage restamps the field', () => {
    const replace = { $replaceWith: { $mergeObjects: ['$$ROOT', { a: 1 }] } };
    expect(() => assertUnscopedUpdate({ update: [replace], filter: {}, field })).toThrow(
      'can not verify'
    );
    expect(() =>
      assertUnscopedUpdate({
        update: [replace, { $set: { organization_id: 'org_a' } }],
        filter: {},
        field,
      })
    ).not.toThrow();
  });

  test('refuses a literal new root without the field', () => {
    expect(() =>
      assertUnscopedUpdate({ update: [{ $replaceRoot: { newRoot: { a: 1 } } }], filter: {}, field })
    ).toThrow('an update removes it');
  });

  test('treats an inclusion $project without the field as dropping it', () => {
    expect(() =>
      assertUnscopedUpdate({ update: [{ $project: { title: 1 } }], filter: {}, field })
    ).toThrow('an update removes it');
    expect(() =>
      assertUnscopedUpdate({ update: [{ $project: { secret: 0 } }], filter: {}, field })
    ).not.toThrow();
  });
});

describe('assertUnscopedBulkOperations', () => {
  test('checks inserts, replacements and updates; lets deletes through', () => {
    expect(() =>
      assertUnscopedBulkOperations({
        operations: [
          { insertOne: { document: { organization_id: 'org_a' } } },
          { replaceOne: { filter: {}, replacement: { organization_id: 'org_a' } } },
          { updateOne: { filter: {}, update: { $set: { a: 1 } } } },
          { deleteMany: { filter: {} } },
        ],
        field,
      })
    ).not.toThrow();
  });

  test('names the failing operation', () => {
    expect(() =>
      assertUnscopedBulkOperations({
        operations: [
          { insertOne: { document: { organization_id: 'org_a' } } },
          { insertOne: { document: { organization_id: null } } },
        ],
        field,
      })
    ).toThrow('bulkWrite operation 1 (insertOne) carries null');
  });

  test('refuses an unknown operation kind', () => {
    expect(() => assertUnscopedBulkOperations({ operations: [{ fooOne: {} }], field })).toThrow(
      'Unsupported bulkWrite operation "fooOne"'
    );
  });
});
