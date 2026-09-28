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
import { ObjectId } from 'mongodb';
import { validate } from '@lowdefy/ajv';

import MongoDBTableChanges from './MongoDBTableChanges.js';
import getTestCollection from '../../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBTableChanges.meta;
const schema = MongoDBTableChanges.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';

let run = 0;

async function setup(documents) {
  run += 1;
  const collection = `tableChanges${run}`;
  await populateTestMongoDb({ collection, documents });
  return { collection, connection: { databaseUri, databaseName, collection, write: true } };
}

async function readAll(collection) {
  const { client, collection: testCollection } = await getTestCollection({ collection });
  try {
    return await testCollection.find({}).sort({ _id: 1 }).toArray();
  } finally {
    await client.close();
  }
}

async function readOne(collection, _id) {
  const docs = await readAll(collection);
  return docs.find((doc) => String(doc._id) === String(_id));
}

const lineFields = {
  item: { type: 'text' },
  qty: { type: 'number' },
  'details.note': { type: 'text' },
  due: { type: 'date' },
};

function lines() {
  return [
    {
      _id: 'a',
      org_id: 'org_1',
      item: 'Apples',
      qty: 3,
      details: { note: 'fresh', origin: 'farm' },
      position: 1024,
      untouched: 'keep',
    },
    {
      _id: 'b',
      org_id: 'org_1',
      item: 'Bread',
      qty: 1,
      details: { note: 'rye', origin: 'bakery' },
      position: 2048,
    },
    { _id: 'c', org_id: 'org_1', item: 'Cheese', qty: 2, position: 3072 },
    { _id: 'x', org_id: 'org_2', item: 'Other org', qty: 9, position: 1024 },
  ];
}

function save({ connection, tenant, tenantGuard, ...properties }) {
  return MongoDBTableChanges({
    request: { fields: lineFields, filter: { org_id: 'org_1' }, ...properties },
    connection,
    tenant,
    tenantGuard,
  });
}

test('checkRead should be false', () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', () => {
  expect(checkWrite).toBe(true);
});

test('the schema accepts a full request and refuses one without changes', () => {
  expect(
    validate({
      schema,
      data: {
        changes: { updated: {}, added: [], removed: [] },
        fields: lineFields,
        filter: {},
        array: { documentId: 'd', path: 'items', itemKeyField: 'id' },
        positionField: 'position',
        insertDefaults: { org_id: 'org_1' },
        rowKeyType: 'string',
        ordered: false,
        maxChanges: 10,
      },
    })
  ).toEqual({ valid: true });
  expect(() => validate({ schema, data: { fields: lineFields } })).toThrow(
    'MongoDBTableChanges request should have required property "changes".'
  );
  expect(() =>
    validate({ schema, data: { changes: {}, fields: { a: { type: 'text', search: true } } } })
  ).toThrow('MongoDBTableChanges request field should only have "type" and "path".');
});

describe('collection mode', () => {
  test('an update touches only the changed dot paths', async () => {
    const { collection, connection } = await setup(lines());
    const before = await readAll(collection);
    const response = await save({
      connection,
      changes: { updated: { a: { qty: 5, 'details.note': 'ripe' } }, added: [], removed: [] },
    });
    expect(response).toEqual({
      matchedCount: 1,
      modifiedCount: 1,
      insertedCount: 0,
      deletedCount: 0,
      insertedKeys: {},
    });
    const after = await readAll(collection);
    expect(after[0]).toEqual({
      ...before[0],
      qty: 5,
      details: { note: 'ripe', origin: 'farm' },
    });
    expect(after.slice(1)).toEqual(before.slice(1));
  });

  test('add, remove and move in one save', async () => {
    const { collection, connection } = await setup(lines());
    const response = await save({
      connection,
      positionField: 'position',
      insertDefaults: { org_id: 'org_1', created_by: 'user_1' },
      changes: {
        updated: { b: { qty: 4 } },
        added: [
          { rowKey: 'tmp-1', item: 'Dates', qty: 6, details: { note: 'dry' }, position: 4096 },
        ],
        removed: ['c'],
        moved: { b: 512 },
      },
    });
    const newId = response.insertedKeys['tmp-1'];
    expect(ObjectId.isValid(newId._oid)).toBe(true);
    expect(response).toEqual({
      matchedCount: 1,
      modifiedCount: 1,
      insertedCount: 1,
      deletedCount: 1,
      insertedKeys: { 'tmp-1': newId },
    });
    const after = await readAll(collection);
    expect(after.map((doc) => doc.item).sort()).toEqual(['Apples', 'Bread', 'Dates', 'Other org']);
    const bread = await readOne(collection, 'b');
    expect(bread.qty).toBe(4);
    expect(bread.position).toBe(512);
    const added = await readOne(collection, newId._oid);
    expect(added).toEqual({
      _id: new ObjectId(newId._oid),
      org_id: 'org_1',
      created_by: 'user_1',
      item: 'Dates',
      qty: 6,
      details: { note: 'dry' },
      position: 4096,
    });
  });

  test('a move writes one position field on one row', async () => {
    const { collection, connection } = await setup(lines());
    const before = await readAll(collection);
    const response = await save({
      connection,
      positionField: 'position',
      changes: { updated: {}, added: [], removed: [], moved: { c: 1536 } },
    });
    expect(response.modifiedCount).toBe(1);
    const after = await readAll(collection);
    expect(after).toEqual(
      before.map((doc) => (doc._id === 'c' ? { ...doc, position: 1536 } : doc))
    );
  });

  test('an order with a positionField renumbers the rows', async () => {
    const { collection, connection } = await setup(lines());
    await save({
      connection,
      positionField: 'position',
      changes: { updated: {}, added: [], removed: [], order: ['c', 'a', 'b'] },
    });
    const after = await readAll(collection);
    expect(after.map((doc) => [doc._id, doc.position])).toEqual([
      ['a', 2048],
      ['b', 3072],
      ['c', 1024],
      ['x', 1024],
    ]);
  });

  test('the base filter prevents writing another tenant document', async () => {
    const { collection, connection } = await setup(lines());
    const before = await readAll(collection);
    const updateResponse = await save({
      connection,
      changes: { updated: { x: { item: 'hijacked' } } },
    });
    expect(updateResponse.matchedCount).toBe(0);
    const removeResponse = await save({ connection, changes: { removed: ['x'] } });
    expect(removeResponse.deletedCount).toBe(0);
    expect(await readAll(collection)).toEqual(before);
  });

  test('rows keyed by ObjectId are matched by the Table key text', async () => {
    const first = new ObjectId();
    const second = new ObjectId();
    const { collection, connection } = await setup([
      { _id: first, org_id: 'org_1', item: 'One', qty: 1 },
      { _id: second, org_id: 'org_1', item: 'Two', qty: 2 },
    ]);
    await save({
      connection,
      changes: {
        updated: { [`{"_oid":"${first.toHexString()}"}`]: { qty: 10 } },
        removed: [{ _oid: second.toHexString() }],
      },
    });
    expect(await readAll(collection)).toEqual([
      { _id: first, org_id: 'org_1', item: 'One', qty: 10 },
    ]);
  });

  test('values are stored as the field type', async () => {
    const { collection, connection } = await setup(lines());
    await save({ connection, changes: { updated: { a: { qty: '7', due: '2026-10-01' } } } });
    const apples = await readOne(collection, 'a');
    expect(apples.qty).toBe(7);
    expect(apples.due).toEqual(new Date('2026-10-01T00:00:00.000Z'));
  });

  test('a refused changeset writes nothing', async () => {
    const { collection, connection } = await setup(lines());
    const before = await readAll(collection);
    await expect(
      save({ connection, changes: { updated: { a: { qty: 1, org_id: 'org_2' } } } })
    ).rejects.toThrow('MongoDBTableChanges updated row "a": "org_id" is not in "fields".');
    await expect(
      save({ connection, changes: { updated: { a: { $where: 'sleep(100)' } } } })
    ).rejects.toThrow('is not allowed');
    await expect(save({ connection, changes: { removed: [{ $ne: null }] } })).rejects.toThrow(
      'has an invalid row key'
    );
    expect(await readAll(collection)).toEqual(before);
  });

  test('a bulk write error is mapped without quoting the document values', async () => {
    const { connection } = await setup(lines());
    const error = await save({
      connection,
      fields: { ...lineFields, _id: { type: 'text' } },
      changes: { added: [{ rowKey: 'a', _id: 'a', item: 'Duplicate' }] },
    }).catch((caught) => caught);
    expect(error.name).toBe('ServiceError');
    expect(error.message).toBe(`MongoDB: Duplicate key on collection "${connection.collection}".`);
  });
});

describe('array mode', () => {
  function recipes() {
    return [
      {
        _id: 'recipe_1',
        org_id: 'org_1',
        title: 'Bread',
        items: [
          {
            _id: 'flour',
            item: 'Flour',
            qty: 500,
            position: 1024,
            details: { note: 'strong', grade: 1 },
          },
          { _id: 'water', item: 'Water', qty: 350, position: 2048 },
          { _id: 'salt', item: 'Salt', qty: 10, position: 3072 },
        ],
      },
      {
        _id: 'recipe_2',
        org_id: 'org_2',
        title: 'Other org',
        items: [{ _id: 'flour', item: 'Flour', qty: 1, position: 1024 }],
      },
    ];
  }

  const array = { documentId: 'recipe_1', path: 'items' };

  test('edits the right embedded items and leaves the others untouched', async () => {
    const { collection, connection } = await setup(recipes());
    const before = await readAll(collection);
    const response = await save({
      connection,
      array,
      changes: {
        updated: { flour: { qty: 450, 'details.note': 'bread flour' }, salt: { qty: 12 } },
      },
    });
    expect(response).toEqual({
      matchedCount: 1,
      modifiedCount: 1,
      insertedCount: 0,
      deletedCount: 0,
      insertedKeys: {},
    });
    const [recipe, other] = await readAll(collection);
    expect(recipe.items).toEqual([
      { ...before[0].items[0], qty: 450, details: { note: 'bread flour', grade: 1 } },
      before[0].items[1],
      { ...before[0].items[2], qty: 12 },
    ]);
    expect(recipe.title).toBe('Bread');
    expect(other).toEqual(before[1]);
  });

  test('add, remove and move items in one save', async () => {
    const { collection, connection } = await setup(recipes());
    const response = await save({
      connection,
      array,
      positionField: 'position',
      insertDefaults: { unit: 'g' },
      changes: {
        updated: { water: { qty: 300 } },
        added: [{ rowKey: 'tmp', item: 'Yeast', qty: 7, position: 1536 }],
        removed: ['salt'],
        moved: { water: 512 },
      },
    });
    const yeastId = response.insertedKeys.tmp;
    expect(response).toEqual({
      matchedCount: 1,
      modifiedCount: 1,
      insertedCount: 1,
      deletedCount: 1,
      insertedKeys: { tmp: yeastId },
    });
    const [recipe] = await readAll(collection);
    expect(recipe.items).toEqual([
      recipes()[0].items[0],
      { _id: 'water', item: 'Water', qty: 300, position: 512 },
      { _id: new ObjectId(yeastId._oid), unit: 'g', item: 'Yeast', qty: 7, position: 1536 },
    ]);
  });

  test('a move writes one position field on one item', async () => {
    const { collection, connection } = await setup(recipes());
    const before = await readAll(collection);
    await save({
      connection,
      array,
      positionField: 'position',
      changes: { moved: { salt: 1536 } },
    });
    const after = await readAll(collection);
    expect(after[0].items).toEqual([
      before[0].items[0],
      before[0].items[1],
      { ...before[0].items[2], position: 1536 },
    ]);
    expect(after[1]).toEqual(before[1]);
  });

  test('an order without a positionField reorders the array, keeping item contents', async () => {
    const { collection, connection } = await setup(recipes());
    // An edit made after the table loaded must survive the reorder.
    const { client, collection: raw } = await getTestCollection({ collection });
    try {
      await raw.updateOne({ _id: 'recipe_1' }, { $set: { 'items.1.qty': 999 } });
      await raw.updateOne({ _id: 'recipe_1' }, { $push: { items: { _id: 'late', item: 'Late' } } });
    } finally {
      await client.close();
    }
    const response = await save({
      connection,
      array,
      changes: {
        added: [{ rowKey: 'tmp', item: 'Seeds' }],
        order: ['salt', 'tmp', 'gone', 'flour', 'water'],
      },
    });
    const seedsId = new ObjectId(response.insertedKeys.tmp._oid);
    const [recipe] = await readAll(collection);
    expect(recipe.items.map((item) => item._id)).toEqual([
      'salt',
      seedsId,
      'flour',
      'water',
      'late',
    ]);
    expect(recipe.items[3]).toEqual({ _id: 'water', item: 'Water', qty: 999, position: 2048 });
    expect(recipe.items[2]).toEqual(recipes()[0].items[0]);
  });

  test('an order key that looks like a field path is a value', async () => {
    const { collection, connection } = await setup([
      { _id: 'd', org_id: 'org_1', items: [{ _id: '$items' }, { _id: 'b' }] },
    ]);
    await save({
      connection,
      array: { documentId: 'd', path: 'items' },
      changes: { order: ['b', '$items'] },
    });
    const [doc] = await readAll(collection);
    expect(doc.items).toEqual([{ _id: 'b' }, { _id: '$items' }]);
  });

  test('the base filter prevents writing another tenant document', async () => {
    const { collection, connection } = await setup(recipes());
    const before = await readAll(collection);
    await expect(
      save({
        connection,
        array: { documentId: 'recipe_2', path: 'items' },
        changes: {
          updated: { flour: { qty: 0 } },
          removed: ['other'],
          added: [{ rowKey: 't', item: 'X' }],
        },
      })
    ).rejects.toThrow(
      'MongoDBTableChanges found no document with "array.documentId" inside "filter", so nothing was written.'
    );
    expect(await readAll(collection)).toEqual(before);
  });

  test('items keyed by a custom field', async () => {
    const { collection, connection } = await setup([
      {
        _id: 'd',
        org_id: 'org_1',
        lines: [
          { id: 1, item: 'A' },
          { id: 2, item: 'B' },
        ],
      },
    ]);
    await save({
      connection,
      array: { documentId: 'd', path: 'lines', itemKeyField: 'id' },
      rowKeyType: 'number',
      fields: { item: { type: 'text' }, id: { type: 'number' } },
      changes: {
        updated: { 2: { item: 'Bee' } },
        added: [{ rowKey: 'tmp', id: 3, item: 'C' }],
        removed: [1],
      },
    });
    const [doc] = await readAll(collection);
    expect(doc.lines).toEqual([
      { id: 2, item: 'Bee' },
      { id: 3, item: 'C' },
    ]);
  });
});

describe('tenant connections', () => {
  const tenant = { field: 'organization_id', value: 'org_a' };

  function tenantRows() {
    return [
      { _id: 'a1', organization_id: 'org_a', item: 'Mine', qty: 1 },
      { _id: 'b1', organization_id: 'org_b', item: 'Theirs', qty: 1 },
    ];
  }

  test('a tenant-scoped save needs no filter, stays inside the tenant and stamps new rows', async () => {
    const { collection, connection } = await setup(tenantRows());
    const saved = await save({
      connection,
      tenant,
      filter: undefined,
      changes: {
        updated: { a1: { qty: 2 }, b1: { qty: 2 } },
        added: [{ rowKey: 'tmp', item: 'New' }],
      },
    });
    expect(saved.matchedCount).toBe(1);
    const removed = await save({
      connection,
      tenant,
      filter: undefined,
      changes: { removed: ['b1'] },
    });
    expect(removed.deletedCount).toBe(0);
    const after = await readAll(collection);
    const newId = new ObjectId(saved.insertedKeys.tmp._oid);
    expect(after).toEqual([
      { _id: 'a1', organization_id: 'org_a', item: 'Mine', qty: 2 },
      { _id: 'b1', organization_id: 'org_b', item: 'Theirs', qty: 1 },
      { _id: newId, organization_id: 'org_a', item: 'New' },
    ]);
  });

  test('tenant: none refuses new rows without an organization id, and accepts it from insertDefaults', async () => {
    const { collection, connection } = await setup(tenantRows());
    const tenantGuard = { field: 'organization_id', stampChangeLog: false };
    await expect(
      save({
        connection,
        tenantGuard,
        filter: {},
        changes: { added: [{ rowKey: 'tmp', item: 'Orphan' }] },
      })
    ).rejects.toThrow('Unscoped write to a walled collection');
    const saved = await save({
      connection,
      tenantGuard,
      filter: {},
      insertDefaults: { organization_id: 'org_b' },
      changes: { added: [{ rowKey: 'tmp', item: 'Placed' }] },
    });
    const added = await readOne(collection, saved.insertedKeys.tmp._oid);
    expect(added.organization_id).toBe('org_b');
  });
});

describe('change log', () => {
  test('a save writes one change-log record, stamped with the tenant', async () => {
    const { collection, connection } = await setup(lines());
    const logCollection = `${collection}Log`;
    await populateTestMongoDb({ collection: logCollection, documents: [{ _id: 'marker' }] });
    const tenant = { field: 'org_id', value: 'org_1' };
    await MongoDBTableChanges({
      request: { fields: lineFields, changes: { updated: { a: { qty: 8 } } } },
      connection: { ...connection, changeLog: { collection: logCollection, meta: { by: 'u1' } } },
      tenant,
      requestId: 'save_lines',
      pageId: 'page',
    });
    const records = (await readAll(logCollection)).filter((record) => record._id !== 'marker');
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      type: 'MongoDBTableChanges',
      requestId: 'save_lines',
      pageId: 'page',
      meta: { by: 'u1' },
      org_id: 'org_1',
      args: { changes: { updated: { a: { qty: 8 } } } },
      response: { matchedCount: 1, modifiedCount: 1 },
    });
  });

  test('tenant: none on a change-logged connection needs a filter that pins one organization', async () => {
    const { collection, connection } = await setup([
      { _id: 'a1', organization_id: 'org_a', item: 'A', qty: 1 },
    ]);
    const logCollection = `${collection}Log`;
    await populateTestMongoDb({ collection: logCollection, documents: [{ _id: 'marker' }] });
    const logged = { ...connection, changeLog: { collection: logCollection } };
    const tenantGuard = { field: 'organization_id', stampChangeLog: true };
    await expect(
      save({
        connection: logged,
        tenantGuard,
        filter: {},
        changes: { updated: { a1: { qty: 2 } } },
      })
    ).rejects.toThrow(
      'the filter does not match "organization_id" by equality to one organization id'
    );
    await expect(
      save({
        connection: logged,
        tenantGuard,
        filter: { organization_id: 'org_a' },
        insertDefaults: { organization_id: 'org_b' },
        changes: { updated: { a1: { qty: 2 } }, added: [{ rowKey: 't', item: 'B' }] },
      })
    ).rejects.toThrow('the filter matches "org_a" but the added rows carry "org_b"');
    await save({
      connection: logged,
      tenantGuard,
      filter: { organization_id: 'org_a' },
      insertDefaults: { organization_id: 'org_a' },
      changes: { updated: { a1: { qty: 2 } }, added: [{ rowKey: 't', item: 'B' }] },
    });
    const records = (await readAll(logCollection)).filter((record) => record._id !== 'marker');
    expect(records.map((record) => record.organization_id)).toEqual(['org_a']);
  });
});
