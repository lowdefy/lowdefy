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

import compileTableChanges from './compileTableChanges.js';

const fields = {
  name: { type: 'text' },
  qty: { type: 'number' },
  'address.city': { type: 'text' },
  due: { type: 'date' },
  done: { type: 'boolean' },
  tags: { type: 'tags' },
  meta: { type: 'json' },
  owner: { type: 'text', path: 'owner.name' },
};

const filter = { org_id: 'org_1' };

function createIdGenerator() {
  let counter = 0;
  return function generateId() {
    counter += 1;
    return new ObjectId(`64b0000000000000000000${String(counter).padStart(2, '0')}`);
  };
}

const now = new Date('2026-09-29T12:00:00.000Z');

function compile(properties, { tenantScoped = false } = {}) {
  return compileTableChanges({
    properties: { fields, filter, ...properties },
    tenantScoped,
    generateId: createIdGenerator(),
    now,
  });
}

function scoped(match) {
  return { $and: [filter, match] };
}

const oid = new ObjectId('64b0000000000000000000aa');

describe('collection mode', () => {
  test('an updated row compiles to one updateOne that sets only its changed dot paths', () => {
    const compiled = compile({
      changes: { updated: { a: { qty: 3, 'address.city': 'Paris', owner: 'Ada' } } },
    });
    expect(compiled.mode).toBe('collection');
    expect(compiled.operations).toEqual([
      {
        updateOne: {
          filter: scoped({ _id: 'a' }),
          update: { $set: { qty: 3, 'address.city': 'Paris', 'owner.name': 'Ada' } },
        },
      },
    ]);
    expect(compiled.insertedKeys).toEqual({});
  });

  test('each updated row gets its own updateOne', () => {
    const { operations } = compile({
      changes: { updated: { a: { qty: 1 }, b: { name: 'Bread' } } },
    });
    expect(operations).toEqual([
      { updateOne: { filter: scoped({ _id: 'a' }), update: { $set: { qty: 1 } } } },
      { updateOne: { filter: scoped({ _id: 'b' }), update: { $set: { name: 'Bread' } } } },
    ]);
  });

  test('an update and a move of the same row merge into one updateOne', () => {
    const { operations } = compile({
      positionField: 'position',
      changes: { updated: { a: { qty: 2 } }, moved: { a: 1536, b: 512 } },
    });
    expect(operations).toEqual([
      {
        updateOne: { filter: scoped({ _id: 'a' }), update: { $set: { qty: 2, position: 1536 } } },
      },
      { updateOne: { filter: scoped({ _id: 'b' }), update: { $set: { position: 512 } } } },
    ]);
  });

  test('a move writes one position field on one row', () => {
    const { operations } = compile({
      positionField: 'sort.position',
      changes: { moved: { c: 7.5 } },
    });
    expect(operations).toEqual([
      { updateOne: { filter: scoped({ _id: 'c' }), update: { $set: { 'sort.position': 7.5 } } } },
    ]);
  });

  test('a move wins over an edited position of the same row', () => {
    const { operations } = compile({
      fields: { ...fields, position: { type: 'number' } },
      positionField: 'position',
      changes: { updated: { a: { position: 1 } }, moved: { a: 2048 } },
    });
    expect(operations[0].updateOne.update).toEqual({ $set: { position: 2048 } });
  });

  test('an added row is inserted with a generated _id, insertDefaults and nested values', () => {
    const created = new Date('2026-09-29T00:00:00.000Z');
    const compiled = compile({
      insertDefaults: { org_id: 'org_1', created, status: 'draft' },
      changes: {
        added: [{ rowKey: 'tmp-1', name: 'Apples', address: { city: 'Rome' } }],
      },
    });
    const id = new ObjectId('64b000000000000000000001');
    expect(compiled.operations).toEqual([
      {
        insertOne: {
          document: {
            _id: id,
            org_id: 'org_1',
            created,
            status: 'draft',
            name: 'Apples',
            address: { city: 'Rome' },
          },
        },
      },
    ]);
    expect(compiled.insertedKeys).toEqual({ 'tmp-1': id });
  });

  test('insertDefaults are copied for each added row', () => {
    const { operations } = compile({
      insertDefaults: { address: { country: 'FR' } },
      changes: {
        added: [
          { rowKey: 'n1', address: { city: 'Paris' } },
          { rowKey: 'n2', address: { city: 'Lyon' } },
        ],
      },
    });
    expect(operations.map((operation) => operation.insertOne.document.address)).toEqual([
      { country: 'FR', city: 'Paris' },
      { country: 'FR', city: 'Lyon' },
    ]);
  });

  test('an added row keeps its real key when a field sets the key field', () => {
    const compiled = compile({
      fields: { ...fields, code: { type: 'text' } },
      rowKeyField: 'code',
      changes: { added: [{ rowKey: 'X-1', code: 'X-1', name: 'Ten' }] },
    });
    expect(compiled.operations).toEqual([
      { insertOne: { document: { org_id: 'org_1', code: 'X-1', name: 'Ten' } } },
    ]);
    expect(compiled.insertedKeys).toEqual({ 'X-1': 'X-1' });
  });

  test('an added row without a key is refused when the key field is not _id', () => {
    expect(() =>
      compile({ rowKeyField: 'code', changes: { added: [{ rowKey: 'tmp', name: 'A' }] } })
    ).toThrow(
      'MongoDBTableChanges added row "tmp" has no "code" value. With a key field other than "_id", new rows need their key from a column (in "fields") or "insertDefaults".'
    );
  });

  test('removed rows are deleted one by one before updates and inserts', () => {
    const { operations } = compile({
      changes: {
        updated: { a: { qty: 1 } },
        added: [{ rowKey: 'n', name: 'N' }],
        removed: ['b', 'c'],
      },
    });
    expect(operations.map((operation) => Object.keys(operation)[0])).toEqual([
      'deleteOne',
      'deleteOne',
      'updateOne',
      'insertOne',
    ]);
    expect(operations[0]).toEqual({ deleteOne: { filter: scoped({ _id: 'b' }) } });
    expect(operations[1]).toEqual({ deleteOne: { filter: scoped({ _id: 'c' }) } });
  });

  test('an order with a positionField writes a position per row, added rows included', () => {
    const compiled = compile({
      positionField: 'position',
      changes: {
        added: [{ rowKey: 'tmp', name: 'New' }],
        order: ['b', 'tmp', 'a'],
      },
    });
    expect(compiled.operations).toEqual([
      { updateOne: { filter: scoped({ _id: 'b' }), update: { $set: { position: 1024 } } } },
      { updateOne: { filter: scoped({ _id: 'a' }), update: { $set: { position: 3072 } } } },
      {
        insertOne: {
          document: {
            _id: new ObjectId('64b000000000000000000001'),
            org_id: 'org_1',
            name: 'New',
            position: 2048,
          },
        },
      },
    ]);
  });

  test('an added row carries its own position with a positionField', () => {
    const { operations } = compile({
      positionField: 'position',
      changes: { added: [{ rowKey: 'tmp', name: 'New', position: 4096 }] },
    });
    expect(operations[0].insertOne.document.position).toBe(4096);
  });

  test('an empty filter scopes nothing but the row key', () => {
    const { operations } = compile({ filter: {}, changes: { removed: ['a'] } });
    expect(operations).toEqual([{ deleteOne: { filter: { _id: 'a' } } }]);
  });

  test('the row key can not replace a base filter condition on the key field', () => {
    const { operations } = compile({
      filter: { _id: { $in: ['a', 'b'] } },
      changes: { removed: ['z'] },
    });
    expect(operations).toEqual([
      { deleteOne: { filter: { $and: [{ _id: { $in: ['a', 'b'] } }, { _id: 'z' }] } } },
    ]);
  });

  test('bulkWrite options pass through, ordered by default', () => {
    expect(compile({ changes: { removed: ['a'] } }).options).toEqual({ ordered: true });
    expect(
      compile({
        ordered: false,
        options: { comment: 'save', ordered: true },
        changes: { removed: ['a'] },
      }).options
    ).toEqual({ comment: 'save', ordered: false });
  });
});

describe('scope fields', () => {
  const orgFilter = { org_id: 'org_1' };

  test('a field that writes a filter field is refused', () => {
    expect(() =>
      compile({
        filter: orgFilter,
        fields: { ...fields, org_id: { type: 'text' } },
        changes: { updated: { a: { name: 'x' } } },
      })
    ).toThrow(
      'MongoDBTableChanges field "org_id" writes "org_id", which "filter" scopes the rows by, so a change could move a row out of scope. Keep scope fields out of "fields".'
    );
  });

  test('a field that writes into or over a filter field is refused', () => {
    expect(() =>
      compile({
        filter: { owner: { id: 'u1' } },
        changes: { updated: { a: { name: 'x' } } },
      })
    ).toThrow('MongoDBTableChanges field "owner" writes "owner.name", which "filter" scopes');
    expect(() =>
      compile({
        filter: { $and: [orgFilter, { 'address.city.code': { $in: ['a', 'b'] } }] },
        changes: { updated: { a: { name: 'x' } } },
      })
    ).toThrow('MongoDBTableChanges field "address.city" writes "address.city", which "filter"');
    expect(() =>
      compile({
        filter: { $or: [{ team: 't1' }, { qty: { $gt: 0 } }] },
        changes: { updated: { a: { name: 'x' } } },
      })
    ).toThrow('MongoDBTableChanges field "qty" writes "qty", which "filter" scopes');
  });

  test('a positionField that is a filter field is refused', () => {
    expect(() =>
      compile({
        filter: { rank: { $gte: 0 } },
        positionField: 'rank',
        changes: { moved: { a: 5 } },
      })
    ).toThrow(
      'MongoDBTableChanges "positionField" writes "rank", which "filter" scopes the rows by'
    );
  });

  test('a field that writes an insertDefaults path is refused, a sibling path is not', () => {
    expect(() =>
      compile({
        insertDefaults: { owner: { name: 'Ada' } },
        changes: { updated: { a: { name: 'x' } } },
      })
    ).toThrow(
      'MongoDBTableChanges field "owner" writes "owner.name", which "insertDefaults" sets on new rows, so a row could replace it. Leave the field out of "fields", or give its column a default in TableInput instead.'
    );
    expect(() =>
      compile({
        insertDefaults: { address: { country: 'FR' } },
        changes: { updated: { a: { 'address.city': 'Lyon' } } },
      })
    ).not.toThrow();
  });

  test('new rows get the equality conditions of the filter', () => {
    const owner = new ObjectId('64b0000000000000000000cc');
    const { operations } = compile({
      filter: { org_id: 'org_1', 'owner_ref.id': { $eq: owner }, $and: [{ team: 't1' }] },
      changes: { added: [{ rowKey: 't', name: 'New' }] },
    });
    expect(operations[0].insertOne.document).toEqual({
      _id: new ObjectId('64b000000000000000000001'),
      org_id: 'org_1',
      owner_ref: { id: owner },
      team: 't1',
      name: 'New',
    });
  });

  test('insertDefaults may repeat a filter equality, but not contradict it', () => {
    const { operations } = compile({
      filter: orgFilter,
      insertDefaults: { org_id: 'org_1' },
      changes: { added: [{ rowKey: 't', name: 'New' }] },
    });
    expect(operations[0].insertOne.document.org_id).toBe('org_1');
    expect(() =>
      compile({
        filter: orgFilter,
        insertDefaults: { org_id: 'org_2' },
        changes: { added: [{ rowKey: 't', name: 'New' }] },
      })
    ).toThrow(
      'MongoDBTableChanges "insertDefaults" sets "org_id" to "org_2", but "filter" matches "org_id" to "org_1", so new rows would be out of scope.'
    );
  });

  test('a filter condition that is not an equality needs insertDefaults for new rows', () => {
    const filterWithStatus = { org_id: 'org_1', status: { $ne: 'archived' } };
    expect(() =>
      compile({
        filter: filterWithStatus,
        changes: { added: [{ rowKey: 't', name: 'New' }] },
      })
    ).toThrow(
      'MongoDBTableChanges can not add rows: "filter" matches "status" by a condition that is not an equality, so new rows need "status" set by "insertDefaults".'
    );
    const { operations } = compile({
      filter: filterWithStatus,
      insertDefaults: { status: 'active' },
      changes: { added: [{ rowKey: 't', name: 'New' }] },
    });
    expect(operations[0].insertOne.document).toMatchObject({ org_id: 'org_1', status: 'active' });
    expect(() =>
      compile({ filter: filterWithStatus, changes: { updated: { a: { name: 'x' } } } })
    ).not.toThrow();
  });

  test('a filter operator new rows can not be checked against refuses adding rows', () => {
    expect(() =>
      compile({
        filter: { $expr: { $eq: ['$org_id', 'org_1'] } },
        changes: { added: [{ rowKey: 't', name: 'New' }] },
      })
    ).toThrow(
      'MongoDBTableChanges can not add rows: "filter" has "$expr", which new rows can not be stamped with. Scope the rows with equality conditions such as { org_id: <value> }.'
    );
    expect(() =>
      compile({
        filter: { $or: [{ team: 't1' }, { team: 't2' }] },
        changes: { added: [{ rowKey: 't', name: 'New' }] },
      })
    ).toThrow('new rows need "team" set by "insertDefaults"');
  });

  test('array mode compares scope fields with the item paths in the document', () => {
    const array = { documentId: 'recipe_1', path: 'items' };
    expect(() =>
      compile({
        array,
        filter: { org_id: 'org_1', 'items.locked': { $ne: true } },
        fields: { ...fields, locked: { type: 'boolean' } },
        changes: { updated: { a: { locked: true } } },
      })
    ).toThrow('MongoDBTableChanges field "locked" writes "items.locked", which "filter" scopes');
    const { operations } = compile({
      array,
      filter: { org_id: 'org_1', status: { $ne: 'archived' } },
      fields: { ...fields, org_id: { type: 'text' } },
      changes: { added: [{ rowKey: 't', name: 'New', org_id: 'org_2' }] },
    });
    // The document is scoped by the filter; the pushed item is not a document of it.
    expect(operations[0].updateOne.update.$push.items.$each).toEqual([
      { _id: new ObjectId('64b000000000000000000001'), name: 'New', org_id: 'org_2' },
    ]);
  });
});

describe('filter', () => {
  test('a missing filter is refused on a connection without a tenant', () => {
    expect(() => compile({ filter: undefined, changes: { removed: ['a'] } })).toThrow(
      'MongoDBTableChanges requires a "filter" that scopes every write, for example { org_id: { _user: organization.id } }. Set "filter: {}" to allow writes to every document in the collection.'
    );
  });

  test('a missing filter is allowed on a tenant-scoped connection', () => {
    const { operations } = compile(
      { filter: undefined, changes: { removed: ['a'] } },
      { tenantScoped: true }
    );
    expect(operations).toEqual([{ deleteOne: { filter: { _id: 'a' } } }]);
  });

  test('a filter that is not an object is refused', () => {
    expect(() => compile({ filter: 'org_1', changes: { removed: ['a'] } })).toThrow(
      'MongoDBTableChanges "filter" should be an object. Received "org_1".'
    );
  });
});

describe('row keys', () => {
  test('auto reads the Table key text of an ObjectId as an ObjectId', () => {
    const key = `{"_oid":"${oid.toHexString()}"}`;
    const { operations } = compile({
      positionField: 'position',
      changes: {
        updated: { [key]: { qty: 1 } },
        moved: { [key]: 5 },
        removed: [`{"_oid":"64b0000000000000000000bb"}`],
      },
    });
    expect(operations).toEqual([
      { deleteOne: { filter: scoped({ _id: new ObjectId('64b0000000000000000000bb') }) } },
      { updateOne: { filter: scoped({ _id: oid }), update: { $set: { qty: 1, position: 5 } } } },
    ]);
  });

  test('auto keeps ObjectIds revived from { _oid } and numbers', () => {
    const { operations } = compile({ changes: { removed: [oid, 7] } });
    expect(operations.map((operation) => operation.deleteOne.filter)).toEqual([
      scoped({ _id: oid }),
      scoped({ _id: { $in: [7, '7'] } }),
    ]);
  });

  test('auto matches a numeric key in its number and string forms, from object keys and arrays alike', () => {
    const { operations } = compile({
      changes: { updated: { 5: { qty: 3 } }, removed: [6] },
    });
    expect(operations).toEqual([
      { deleteOne: { filter: scoped({ _id: { $in: [6, '6'] } }) } },
      { updateOne: { filter: scoped({ _id: { $in: [5, '5'] } }), update: { $set: { qty: 3 } } } },
    ]);
  });

  test('auto reads the object key "5" and the array value 5 as the same row', () => {
    expect(() => compile({ changes: { updated: { 5: { qty: 3 } }, removed: [5] } })).toThrow(
      'MongoDBTableChanges row 5 is removed, so it can not also be updated, moved or ordered.'
    );
    expect(() => compile({ changes: { removed: [5, '5'] } })).toThrow(
      'MongoDBTableChanges removed row "5" appears twice.'
    );
  });

  test('auto keeps a string that is not how a number prints as a string', () => {
    const { operations } = compile({ changes: { removed: ['05', '1e3', ' 5', '5x', '-0'] } });
    expect(operations.map((operation) => operation.deleteOne.filter)).toEqual([
      scoped({ _id: '05' }),
      scoped({ _id: '1e3' }),
      scoped({ _id: ' 5' }),
      scoped({ _id: '5x' }),
      scoped({ _id: '-0' }),
    ]);
  });

  test('rowKeyType string and number match one form only', () => {
    const { operations: numberOperations } = compile({
      rowKeyType: 'number',
      changes: { updated: { 5: { qty: 1 } }, removed: [6] },
    });
    expect(numberOperations.map((operation) => Object.values(operation)[0].filter)).toEqual([
      scoped({ _id: 6 }),
      scoped({ _id: 5 }),
    ]);
    const { operations: stringOperations } = compile({
      rowKeyType: 'string',
      changes: { updated: { 5: { qty: 1 } }, removed: ['6'] },
    });
    expect(stringOperations.map((operation) => Object.values(operation)[0].filter)).toEqual([
      scoped({ _id: '6' }),
      scoped({ _id: '5' }),
    ]);
  });

  test('the compiled changes list the keys each operation addresses', () => {
    const compiled = compile({
      changes: {
        updated: { a: { qty: 1 }, 5: { qty: 2 } },
        removed: ['b'],
        added: [{ rowKey: 't' }],
      },
    });
    expect(compiled.targets).toEqual({
      removed: [{ index: 0, key: 'b' }],
      updated: [
        { index: 1, key: 5 },
        { index: 2, key: 'a' },
      ],
    });
    expect(compiled.rowKeyType).toBe('auto');
    expect(compiled.keyField).toBe('_id');
  });

  test('rowKeyType objectId reads hex strings', () => {
    const { operations } = compile({
      rowKeyType: 'objectId',
      changes: { removed: [oid.toHexString()] },
    });
    expect(operations[0].deleteOne.filter).toEqual(scoped({ _id: oid }));
  });

  test('rowKeyType number reads the string keys of updated and moved', () => {
    const { operations } = compile({
      rowKeyType: 'number',
      positionField: 'position',
      changes: { updated: { 5: { qty: 1 } }, moved: { 5: 10 } },
    });
    expect(operations).toEqual([
      { updateOne: { filter: scoped({ _id: 5 }), update: { $set: { qty: 1, position: 10 } } } },
    ]);
  });

  test('a custom rowKeyField matches rows by that field', () => {
    const { operations } = compile({ rowKeyField: 'code', changes: { removed: ['X-1'] } });
    expect(operations).toEqual([{ deleteOne: { filter: scoped({ code: 'X-1' }) } }]);
  });

  test.each([
    ['an operator object', { $ne: null }],
    ['an array', ['a']],
    ['a boolean', true],
    ['an empty string', ''],
    ['null', null],
  ])('a removed row key that is %s is refused', (_, key) => {
    expect(() => compile({ changes: { removed: [key] } })).toThrow(
      `MongoDBTableChanges "removed" has an invalid row key: expected a string, number or ObjectId (rowKeyType "auto"). Received ${JSON.stringify(
        key
      )}.`
    );
  });

  test('rowKeyType objectId refuses a key that is not an ObjectId', () => {
    expect(() => compile({ rowKeyType: 'objectId', changes: { removed: ['abc'] } })).toThrow(
      'MongoDBTableChanges "removed" has an invalid row key: expected an ObjectId (rowKeyType "objectId"). Received "abc".'
    );
  });

  test('rowKeyType number refuses a key that is not numeric', () => {
    expect(() =>
      compile({ rowKeyType: 'number', changes: { updated: { x: { qty: 1 } } } })
    ).toThrow(
      'MongoDBTableChanges "updated" has an invalid row key: expected a number (rowKeyType "number"). Received "x".'
    );
  });

  test('an unknown rowKeyType is refused', () => {
    expect(() => compile({ rowKeyType: 'uuid', changes: { removed: ['a'] } })).toThrow(
      'MongoDBTableChanges "rowKeyType" should be one of ["auto","objectId","string","number"]. Received "uuid".'
    );
  });
});

describe('values', () => {
  test('values are coerced to the field type', () => {
    const { operations } = compile({
      changes: {
        updated: {
          a: {
            qty: '12.5',
            due: '2026-09-29',
            done: false,
            tags: ['vip', 2],
            meta: { nested: [{ ok: true }] },
            name: 42,
          },
        },
      },
    });
    expect(operations[0].updateOne.update.$set).toEqual({
      qty: 12.5,
      due: new Date('2026-09-29T00:00:00.000Z'),
      done: false,
      tags: ['vip', 2],
      meta: { nested: [{ ok: true }] },
      name: 42,
    });
  });

  test('null clears a value of any type', () => {
    const { operations } = compile({
      changes: { updated: { a: { qty: null, due: null, done: null, tags: null, name: null } } },
    });
    expect(operations[0].updateOne.update.$set).toEqual({
      qty: null,
      due: null,
      done: null,
      tags: null,
      name: null,
    });
  });

  test('avatar fields accept a document value, as image and json fields do', () => {
    const { operations } = compile({
      fields: { person: { type: 'avatar' } },
      changes: { updated: { a: { person: { name: 'Ada', src: 'https://x/a.png' } } } },
    });
    expect(operations[0].updateOne.update).toEqual({
      $set: { person: { name: 'Ada', src: 'https://x/a.png' } },
    });
  });

  test('ObjectId values are kept for text-like fields', () => {
    const { operations } = compile({
      fields: { ...fields, owner_id: { type: 'relation' } },
      changes: { updated: { a: { owner_id: oid } } },
    });
    expect(operations[0].updateOne.update.$set).toEqual({ owner_id: oid });
  });

  test.each([
    ['number', 'qty', 'abc', 'a number', 'number'],
    ['number', 'qty', { $gt: 1 }, 'a number', 'number'],
    ['text', 'name', { $ne: null }, 'a string or number', 'text'],
    ['text', 'name', true, 'a string or number', 'text'],
    ['boolean', 'done', 'yes', 'a boolean', 'boolean'],
    ['date', 'due', 'not a date', 'a date', 'date'],
    ['date', 'due', { $currentDate: true }, 'a date', 'date'],
    ['tags', 'tags', [{ $where: 'x' }], 'an array of strings or numbers', 'tags'],
    ['tags', 'tags', 'vip', 'an array of strings or numbers', 'tags'],
    ['json', 'meta', { $set: { a: 1 } }, 'a value without keys starting with "$"', 'json'],
    ['json', 'meta', { a: [{ $where: '1' }] }, 'a value without keys starting with "$"', 'json'],
  ])('a %s field "%s" refuses %j', (_, key, value, expected, fieldType) => {
    expect(() => compile({ changes: { updated: { a: { [key]: value } } } })).toThrow(
      `MongoDBTableChanges updated row "a": "${key}" expects ${expected} for type "${fieldType}". Received ${JSON.stringify(
        value
      )}.`
    );
  });

  test('a position that is not a number is refused', () => {
    expect(() => compile({ positionField: 'position', changes: { moved: { a: '5' } } })).toThrow(
      'MongoDBTableChanges moved row "a": a position must be a finite number. Received "5".'
    );
  });
});

describe('allowlist and injection', () => {
  test('an updated key outside fields is refused', () => {
    expect(() => compile({ changes: { updated: { a: { org_id: 'org_2' } } } })).toThrow(
      'MongoDBTableChanges updated row "a": "org_id" is not in "fields".'
    );
  });

  test.each(['$where', 'a.$[x]', 'items.$', 'name.$set', 'a..b', ''])(
    'an updated key %j is refused as an operator or positional path',
    (key) => {
      expect(() => compile({ changes: { updated: { a: { [key]: 1 } } } })).toThrow(
        `MongoDBTableChanges updated row "a": key ${JSON.stringify(
          key
        )} is not allowed. Changes can not name MongoDB operators or positional paths.`
      );
    }
  );

  test('a changeset key that is a field path but not a field key names the mismatch', () => {
    expect(() => compile({ changes: { updated: { a: { 'owner.name': 'Ada' } } } })).toThrow(
      'MongoDBTableChanges updated row "a": "owner.name" is not in "fields". The field "owner" writes "owner.name", but changeset keys are the TableInput column field paths, so key that field "owner.name".'
    );
    expect(() => compile({ changes: { added: [{ rowKey: 't', 'owner.name': 'Ada' }] } })).toThrow(
      'MongoDBTableChanges added row "t": "owner.name" is not in "fields". The field "owner" writes "owner.name"'
    );
  });

  test('a prototype key is not an allowlist entry', () => {
    const changes = JSON.parse('{"updated":{"a":{"__proto__":{"x":1}}}}');
    expect(() => compile({ changes })).toThrow(
      'MongoDBTableChanges updated row "a": "__proto__" is not in "fields".'
    );
  });

  test('an added row key outside fields is refused, nested or not', () => {
    expect(() => compile({ changes: { added: [{ rowKey: 't', org_id: 'org_2' }] } })).toThrow(
      'MongoDBTableChanges added row "t": "org_id" is not in "fields".'
    );
    expect(() => compile({ changes: { added: [{ rowKey: 't', address: { zip: '1' } }] } })).toThrow(
      'MongoDBTableChanges added row "t": "address.zip" is not in "fields".'
    );
    expect(() => compile({ changes: { added: [{ rowKey: 't', address: 'Rome' }] } })).toThrow(
      'MongoDBTableChanges added row "t": "address" is not in "fields".'
    );
  });

  test('an added row with an operator key is refused', () => {
    expect(() => compile({ changes: { added: [{ rowKey: 't', $where: 'sleep(1)' }] } })).toThrow(
      'MongoDBTableChanges added row "t": key "$where" is not allowed. Changes can not name MongoDB operators or positional paths.'
    );
    expect(() =>
      compile({ changes: { added: [{ rowKey: 't', address: { $set: { city: 'x' } } }] } })
    ).toThrow(
      'MongoDBTableChanges added row "t": key "address.$set" is not allowed. Changes can not name MongoDB operators or positional paths.'
    );
  });

  test('an added row value is coerced and checked like an update', () => {
    expect(() => compile({ changes: { added: [{ rowKey: 't', qty: { $inc: 1 } }] } })).toThrow(
      'MongoDBTableChanges added row "t": "qty" expects a number for type "number". Received {"$inc":1}.'
    );
  });

  test('an added row needs a rowKey', () => {
    expect(() => compile({ changes: { added: [{ name: 'A' }] } })).toThrow(
      'MongoDBTableChanges added row 0 should have a "rowKey" string or number. Received undefined.'
    );
  });

  test('the row key field can not be updated', () => {
    expect(() =>
      compile({
        fields: { ...fields, code: { type: 'text' } },
        rowKeyField: 'code',
        changes: { updated: { a: { code: 'b' } } },
      })
    ).toThrow('MongoDBTableChanges row "a": the row key field "code" can not be changed.');
  });

  test('overlapping paths in one row are refused', () => {
    expect(() =>
      compile({
        fields: { ...fields, address: { type: 'json' } },
        changes: { updated: { a: { address: {}, 'address.city': 'Rome' } } },
      })
    ).toThrow(
      'MongoDBTableChanges row "a": "address" and "address.city" overlap, so they can not both be written.'
    );
  });
});

describe('changeset shape', () => {
  test('an empty changeset is refused', () => {
    expect(() => compile({ changes: { updated: {}, added: [], removed: [] } })).toThrow(
      'MongoDBTableChanges changes are empty: there is nothing to write.'
    );
  });

  test('a changeset over maxChanges is refused before it is parsed', () => {
    expect(() =>
      compile({ maxChanges: 2, changes: { removed: ['a', 'b'], added: [{ nope: true }] } })
    ).toThrow('MongoDBTableChanges changes have 3 row changes, more than "maxChanges" (2).');
  });

  test('the default maxChanges is 1000', () => {
    const removed = Array.from({ length: 1001 }, (_, index) => `r${index}`);
    expect(() => compile({ changes: { removed } })).toThrow(
      'MongoDBTableChanges changes have 1001 row changes, more than "maxChanges" (1000).'
    );
  });

  test('changes that are not an object are refused', () => {
    expect(() => compile({ changes: [] })).toThrow(
      'MongoDBTableChanges requires "changes", the TableInput value { updated, added, removed, moved, order }. Received [].'
    );
  });

  test('an unknown changeset part is refused', () => {
    expect(() => compile({ changes: { removed: ['a'], replace: {} } })).toThrow(
      'MongoDBTableChanges changes can only have "updated", "added", "removed", "moved" and "order". Received ["replace"].'
    );
  });

  test('a changeset part of the wrong type is refused', () => {
    expect(() => compile({ changes: { removed: 'a' } })).toThrow(
      'MongoDBTableChanges changes "removed" should be an array. Received "a".'
    );
  });

  test('moved without a positionField is refused', () => {
    expect(() => compile({ changes: { moved: { a: 1024 } } })).toThrow(
      'MongoDBTableChanges changes have "moved" positions, but the request has no "positionField" to write them to.'
    );
  });

  test('an order in collection mode without a positionField is refused', () => {
    expect(() => compile({ changes: { order: ['b', 'a'] } })).toThrow(
      'MongoDBTableChanges changes have an "order", which needs a "positionField" to write positions to (or "array" mode, where the array order is the row order).'
    );
  });

  test('moved and order together are refused', () => {
    expect(() =>
      compile({ positionField: 'position', changes: { moved: { a: 1 }, order: ['a'] } })
    ).toThrow('MongoDBTableChanges changes can have "moved" positions or an "order", not both.');
  });

  test('a removed row can not also be updated, moved or ordered', () => {
    expect(() => compile({ changes: { updated: { a: { qty: 1 } }, removed: ['a'] } })).toThrow(
      'MongoDBTableChanges row "a" is removed, so it can not also be updated, moved or ordered.'
    );
    expect(() =>
      compile({
        array: { documentId: 'd', path: 'items' },
        changes: { order: ['a'], removed: ['a'] },
      })
    ).toThrow(
      'MongoDBTableChanges row "a" is removed, so it can not also be updated, moved or ordered.'
    );
  });

  test('duplicate keys are refused', () => {
    expect(() => compile({ changes: { removed: ['a', 'a'] } })).toThrow(
      'MongoDBTableChanges removed row "a" appears twice.'
    );
    expect(() =>
      compile({
        changes: {
          added: [
            { rowKey: 't', name: 'A' },
            { rowKey: 't', name: 'B' },
          ],
        },
      })
    ).toThrow('MongoDBTableChanges added rowKey "t" appears twice.');
    expect(() =>
      compile({ array: { documentId: 'd', path: 'items' }, changes: { order: ['a', 'a'] } })
    ).toThrow('MongoDBTableChanges order row "a" appears twice.');
  });
});

describe('request properties', () => {
  test('fields are required', () => {
    expect(() => compile({ fields: undefined, changes: { removed: ['a'] } })).toThrow(
      'MongoDBTableChanges requires "fields", an object of the fields the changes may write. Received undefined.'
    );
  });

  test('a field of unknown type is refused', () => {
    expect(() =>
      compile({ fields: { a: { type: 'money' } }, changes: { removed: ['a'] } })
    ).toThrow('MongoDBTableChanges field "a" has unknown type "money".');
  });

  test('a field path with an operator is refused', () => {
    expect(() =>
      compile({ fields: { a: { type: 'text', path: 'a.$[x]' } }, changes: { removed: ['a'] } })
    ).toThrow('MongoDBTableChanges field "a" has an invalid path. Received "a.$[x]".');
  });

  test('two fields writing the same path are refused', () => {
    expect(() =>
      compile({
        fields: { owner: { type: 'text', path: 'owner.name' }, 'owner.name': { type: 'text' } },
        changes: { removed: ['a'] },
      })
    ).toThrow('MongoDBTableChanges fields "owner" and "owner.name" both write "owner.name".');
  });

  test.each([
    ['rowKeyField', { rowKeyField: '$where' }, '"$where"'],
    ['positionField', { positionField: 'a.$' }, '"a.$"'],
    ['array.path', { array: { documentId: 'd', path: '$items' } }, '"$items"'],
    ['array.itemKeyField', { array: { documentId: 'd', path: 'items', itemKeyField: '' } }, '""'],
    ['insertDefaults.$set', { insertDefaults: { $set: 1 } }, '"$set"'],
  ])('an unsafe %s is refused', (name, properties, received) => {
    expect(() => compile({ ...properties, changes: { removed: ['a'] } })).toThrow(
      `MongoDBTableChanges "${name}" should be a dot path whose segments are not empty and do not start with "$". Received ${received}.`
    );
  });

  test('an invalid maxChanges is refused', () => {
    expect(() => compile({ maxChanges: 0, changes: { removed: ['a'] } })).toThrow(
      'MongoDBTableChanges "maxChanges" should be a positive integer. Received 0.'
    );
  });

  test('an array documentId that is an operator object is refused', () => {
    expect(() =>
      compile({ array: { documentId: { $ne: null }, path: 'items' }, changes: { removed: ['a'] } })
    ).toThrow(
      'MongoDBTableChanges "array.documentId" should be a string, number or ObjectId. Received {"$ne":null}.'
    );
  });
});

describe('array mode', () => {
  const array = { documentId: 'recipe_1', path: 'items' };
  const documentFilter = scoped({ _id: 'recipe_1' });

  test('updated items compile to one $set with an array filter per item', () => {
    const compiled = compile({
      array,
      changes: { updated: { a: { qty: 2, 'address.city': 'Rome' }, b: { name: 'Salt' } } },
    });
    expect(compiled.mode).toBe('array');
    expect(compiled.operations).toEqual([
      {
        updateOne: {
          filter: documentFilter,
          update: {
            $set: {
              'items.$[r0].qty': 2,
              'items.$[r0].address.city': 'Rome',
              'items.$[r1].name': 'Salt',
            },
          },
          arrayFilters: [{ 'r0._id': 'a' }, { 'r1._id': 'b' }],
        },
      },
    ]);
  });

  test('an update and a move of the same item share one array filter', () => {
    const { operations } = compile({
      array: { ...array, itemKeyField: 'id' },
      positionField: 'position',
      changes: { updated: { a: { qty: 2 } }, moved: { a: 1536, b: 3 } },
    });
    expect(operations).toEqual([
      {
        updateOne: {
          filter: documentFilter,
          update: {
            $set: {
              'items.$[r0].qty': 2,
              'items.$[r0].position': 1536,
              'items.$[r1].position': 3,
            },
          },
          arrayFilters: [{ 'r0.id': 'a' }, { 'r1.id': 'b' }],
        },
      },
    ]);
  });

  test('removed items compile to one $pull by key', () => {
    const { operations } = compile({ array, changes: { removed: ['a', 'b'] } });
    expect(operations).toEqual([
      {
        updateOne: {
          filter: documentFilter,
          update: { $pull: { items: { _id: { $in: ['a', 'b'] } } } },
        },
      },
    ]);
  });

  test('added items compile to one $push with generated _ids and insertDefaults', () => {
    const compiled = compile({
      array,
      insertDefaults: { unit: 'g' },
      changes: {
        added: [
          { rowKey: 't1', name: 'Flour', qty: 500 },
          { rowKey: 't2', name: 'Water' },
        ],
      },
    });
    const first = new ObjectId('64b000000000000000000001');
    const second = new ObjectId('64b000000000000000000002');
    expect(compiled.operations).toEqual([
      {
        updateOne: {
          filter: documentFilter,
          update: {
            $push: {
              items: {
                $each: [
                  { _id: first, unit: 'g', name: 'Flour', qty: 500 },
                  { _id: second, unit: 'g', name: 'Water' },
                ],
              },
            },
          },
        },
      },
    ]);
    expect(compiled.insertedKeys).toEqual({ t1: first, t2: second });
  });

  test('set, pull, push and order run as separate operations in that order', () => {
    const { operations } = compile({
      array,
      changes: {
        updated: { a: { qty: 1 } },
        removed: ['b'],
        added: [{ rowKey: 't', name: 'New' }],
        order: ['t', 'a'],
      },
    });
    expect(operations.map((operation) => Object.keys(operation.updateOne.update))).toEqual([
      ['$set'],
      ['$pull'],
      ['$push'],
      ['0'],
    ]);
  });

  test('an order without a positionField compiles to a pipeline update over the keys', () => {
    const { operations } = compile({
      array,
      changes: { added: [{ rowKey: 't', name: 'New' }], order: ['b', 't', 'a'] },
    });
    const newId = new ObjectId('64b000000000000000000001');
    const orderKeyForms = { $literal: [['b'], [newId], ['a']] };
    const orderKeys = { $literal: ['b', newId, 'a'] };
    expect(operations[1]).toEqual({
      updateOne: {
        filter: documentFilter,
        update: [
          {
            $set: {
              items: {
                $cond: {
                  if: { $isArray: '$items' },
                  then: {
                    $concatArrays: [
                      {
                        $filter: {
                          input: {
                            $map: {
                              input: orderKeyForms,
                              as: 'forms',
                              in: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: '$items',
                                      as: 'item',
                                      cond: { $in: ['$$item._id', '$$forms'] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                          },
                          as: 'found',
                          cond: { $ne: ['$$found', null] },
                        },
                      },
                      {
                        $filter: {
                          input: '$items',
                          as: 'item',
                          cond: { $not: [{ $in: ['$$item._id', orderKeys] }] },
                        },
                      },
                    ],
                  },
                  else: '$items',
                },
              },
            },
          },
        ],
      },
    });
  });

  test('an order with a positionField writes positions through array filters', () => {
    const { operations } = compile({
      array,
      positionField: 'position',
      changes: { order: ['b', 'a'] },
    });
    expect(operations).toEqual([
      {
        updateOne: {
          filter: documentFilter,
          update: { $set: { 'items.$[r0].position': 1024, 'items.$[r1].position': 2048 } },
          arrayFilters: [{ 'r0._id': 'b' }, { 'r1._id': 'a' }],
        },
      },
    ]);
  });

  test('auto matches numeric item keys in their number and string forms', () => {
    const { operations, targets } = compile({
      array,
      changes: { updated: { 5: { qty: 1 } }, removed: [6] },
    });
    expect(operations[0].updateOne.arrayFilters).toEqual([{ 'r0._id': { $in: [5, '5'] } }]);
    expect(operations[1].updateOne.update).toEqual({
      $pull: { items: { _id: { $in: [6, '6'] } } },
    });
    expect(targets).toEqual({ removed: [6], updated: [5] });
  });

  test('an order matches numeric item keys in both forms', () => {
    const { operations } = compile({ array, changes: { order: [5, 'b'] } });
    const [stage] = operations[0].updateOne.update;
    const [ordered, rest] = stage.$set.items.$cond.then.$concatArrays;
    expect(ordered.$filter.input.$map.input).toEqual({ $literal: [[5, '5'], ['b']] });
    expect(rest.$filter.cond).toEqual({
      $not: [{ $in: ['$$item._id', { $literal: [5, '5', 'b'] }] }],
    });
  });

  test('ordered false is refused in array mode', () => {
    expect(() => compile({ array, ordered: false, changes: { removed: ['a'] } })).toThrow(
      'MongoDBTableChanges in array mode runs its updates of the document in order, so "ordered" can not be false.'
    );
  });

  test('the documentId reads the ObjectId key text, is otherwise exact, and the item key field can not be updated', () => {
    const { operations } = compile({
      array: { documentId: `{"_oid":"${oid.toHexString()}"}`, path: 'items' },
      changes: { removed: ['a'] },
    });
    expect(operations[0].updateOne.filter).toEqual(scoped({ _id: oid }));
    const { operations: stringIdOperations } = compile({
      array: { documentId: '5', path: 'items' },
      changes: { removed: ['a'] },
    });
    expect(stringIdOperations[0].updateOne.filter).toEqual(scoped({ _id: '5' }));
    expect(() =>
      compile({
        array: { ...array, itemKeyField: 'code' },
        fields: { ...fields, code: { type: 'text' } },
        changes: { updated: { a: { code: 'b' } } },
      })
    ).toThrow('MongoDBTableChanges row "a": the row key field "code" can not be changed.');
  });
});

describe('bulk selection', () => {
  const queryFields = {
    name: { type: 'text', search: true },
    qty: { type: 'number' },
    owner: { type: 'text', path: 'owner.name', search: true },
  };

  test('a key array sets the fields on those rows with one updateMany', () => {
    const compiled = compile({
      selection: ['a', 5, `{"_oid":"${oid.toHexString()}"}`],
      set: { owner: 'Ada', qty: '3' },
    });
    expect(compiled.mode).toBe('bulk');
    expect(compiled.operations).toEqual([
      {
        updateMany: {
          filter: scoped({ _id: { $in: ['a', 5, '5', oid] } }),
          update: { $set: { 'owner.name': 'Ada', qty: 3 } },
        },
      },
    ]);
  });

  test('select all matching compiles the view filter and search inside the base filter, less except', () => {
    const { operations } = compile({
      queryFields,
      selection: {
        all: true,
        except: ['b', 7],
        filter: { key: 'qty', op: 'gte', value: 2 },
        search: 'ada',
      },
      set: { done: true },
      unset: ['tags'],
    });
    expect(operations).toEqual([
      {
        updateMany: {
          filter: {
            $and: [
              filter,
              { qty: { $gte: 2 } },
              { $or: [{ name: /ada/i }, { 'owner.name': /ada/i }] },
              { _id: { $nin: ['b', 7, '7'] } },
            ],
          },
          update: { $set: { done: true }, $unset: { tags: '' } },
        },
      },
    ]);
  });

  test('select all without a view or except updates every row in the base filter', () => {
    const { operations } = compile({ selection: { all: true }, set: { done: false } });
    expect(operations[0].updateMany.filter).toEqual(filter);
    const { operations: unscoped } = compile({
      filter: {},
      selection: { all: true },
      set: { done: false },
    });
    expect(unscoped[0].updateMany.filter).toEqual({});
  });

  test('a crafted view is refused, and can only narrow the base filter', () => {
    expect(() =>
      compile({
        queryFields,
        selection: { all: true, filter: { $where: 'true' } },
        set: { done: true },
      })
    ).toThrow('MongoDBTableQuery filter condition has an unknown key "$where".');
    expect(() =>
      compile({
        queryFields,
        selection: { all: true, filter: { key: 'org_id', op: 'ne', value: 'x' } },
        set: { done: true },
      })
    ).toThrow('MongoDBTableQuery view filter key "org_id" is not in the request "fields".');
    expect(() =>
      compile({
        queryFields,
        selection: { all: true, filter: { key: 'qty', op: 'gt', value: { $gt: '' } } },
        set: { done: true },
      })
    ).toThrow('operator "gt" expects a number');
  });

  test('a view needs queryFields', () => {
    expect(() => compile({ selection: { all: true, search: 'ada' }, set: { done: true } })).toThrow(
      'MongoDBTableChanges "selection" has a filter or search, so the request needs "queryFields", the MongoDBTableQuery fields of the table.'
    );
  });

  test('set and unset are checked against fields like updated values', () => {
    expect(() => compile({ selection: ['a'], set: { org_id: 'org_2' } })).toThrow(
      'MongoDBTableChanges set: "org_id" is not in "fields".'
    );
    expect(() => compile({ selection: ['a'], set: { $where: 'x' } })).toThrow('is not allowed');
    expect(() => compile({ selection: ['a'], set: { qty: 'many' } })).toThrow(
      'MongoDBTableChanges set: "qty" expects a number for type "number". Received "many".'
    );
    expect(() => compile({ selection: ['a'], unset: ['secret'] })).toThrow(
      'MongoDBTableChanges unset: "secret" is not in "fields".'
    );
    expect(() => compile({ selection: ['a'], set: { name: 'x' }, unset: ['name'] })).toThrow(
      'MongoDBTableChanges set and unset: "name" and "name" overlap, so they can not both be written.'
    );
    expect(() =>
      compile({
        fields: { ...fields, _id: { type: 'text' } },
        filter: {},
        selection: ['a'],
        set: { _id: 'b' },
      })
    ).toThrow('the row key field "_id" can not be changed.');
  });

  test('a selection is refused when it is malformed, empty or too large', () => {
    expect(() => compile({ selection: [], set: { done: true } })).toThrow(
      'MongoDBTableChanges "selection" is empty: there is nothing to write.'
    );
    expect(() => compile({ selection: { all: false }, set: { done: true } })).toThrow(
      'MongoDBTableChanges "selection" should be an array of row keys or { all: true, except, filter, search }. Received {"all":false}.'
    );
    expect(() => compile({ selection: { all: true, where: {} }, set: { done: true } })).toThrow(
      'MongoDBTableChanges "selection" should be an array of row keys or'
    );
    expect(() => compile({ selection: [{ $ne: null }], set: { done: true } })).toThrow(
      'MongoDBTableChanges "selection" has an invalid row key'
    );
    expect(() =>
      compile({ maxChanges: 2, selection: ['a', 'b', 'c'], set: { done: true } })
    ).toThrow('MongoDBTableChanges "selection" has 3 row keys, more than "maxChanges" (2).');
    expect(() =>
      compile({ maxChanges: 1, selection: { all: true, except: ['a', 'b'] }, set: { done: true } })
    ).toThrow('MongoDBTableChanges "selection" has 2 row keys, more than "maxChanges" (1).');
  });

  test('a bulk save needs set or unset, no changes and no array mode', () => {
    expect(() => compile({ selection: ['a'] })).toThrow(
      'MongoDBTableChanges with a "selection" needs "set" or "unset", the fields to write on every selected row.'
    );
    expect(() =>
      compile({ selection: ['a'], set: { done: true }, changes: { removed: ['b'] } })
    ).toThrow('MongoDBTableChanges takes "changes" or a "selection" with "set", not both.');
    expect(() =>
      compile({
        selection: ['a'],
        set: { done: true },
        array: { documentId: 'd', path: 'items' },
      })
    ).toThrow(
      'MongoDBTableChanges "selection" saves rows that are documents, so it can not be used in array mode.'
    );
    expect(() => compile({})).toThrow(
      'MongoDBTableChanges requires "changes", the TableInput value { updated, added, removed, moved, order }. Received undefined.'
    );
  });

  test('a field that writes a scope field is refused in bulk mode too', () => {
    expect(() =>
      compile({
        fields: { ...fields, org_id: { type: 'text' } },
        selection: { all: true },
        set: { org_id: 'org_2' },
      })
    ).toThrow('MongoDBTableChanges field "org_id" writes "org_id", which "filter" scopes');
  });
});
