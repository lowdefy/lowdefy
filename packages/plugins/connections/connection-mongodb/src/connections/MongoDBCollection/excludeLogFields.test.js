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

import { beforeEach, expect, test } from 'vitest';

import { validate } from '@lowdefy/ajv';

import connectionSchema from './schema.js';
import excludeLogFields from './excludeLogFields.js';
import writeEnrichmentLog from './enrichment/writeEnrichmentLog.js';
import MongoDBDeleteMany from './MongoDBDeleteMany/MongoDBDeleteMany.js';
import MongoDBDeleteOne from './MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId/MongoDBInsertConsecutiveId.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertManyConsecutiveIds from './MongoDBInsertManyConsecutiveIds/MongoDBInsertManyConsecutiveIds.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBTableChanges from './MongoDBTableChanges/MongoDBTableChanges.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import findLogCollectionRecordTestMongoDb from '../../../test/findLogCollectionRecordTestMongoDb.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'changeLogExclude';
const logCollection = 'changeLogExcludeLog';
const EXCLUDED = '[excluded]';
const BODY = 'The quote is attached, phase one.';
const SUBJECT = 'Quote for phase one';

const excluding = {
  databaseUri,
  databaseName,
  collection,
  write: true,
  changeLog: { collection: logCollection, meta: { user: 'u1' }, exclude: ['body', 'summary'] },
};
const plain = {
  databaseUri,
  databaseName,
  collection,
  write: true,
  changeLog: { collection: logCollection },
};

function row(_id) {
  return { _id, kind: 'email', summary: SUBJECT, body: BODY, data: { thread: 't1' } };
}

async function logOf({ request, requestType, connection = excluding, requestId }) {
  await requestType({ request, connection, connectionId: 'rows', requestId, payload: {} });
  return findLogCollectionRecordTestMongoDb({ logCollection, requestId });
}

function expectNoText(record) {
  const text = JSON.stringify(record);
  expect(text).not.toContain(BODY);
  expect(text).not.toContain(SUBJECT);
}

beforeEach(() => populateTestMongoDb({ collection, documents: [row('a1'), row('a2')] }));

test('the connection schema takes changeLog.exclude', () => {
  expect(validate({ schema: connectionSchema, data: excluding })).toEqual({ valid: true });
  expect(() =>
    validate({
      schema: connectionSchema,
      data: { ...excluding, changeLog: { collection: logCollection, exclude: 'body' } },
    })
  ).toThrow(
    'MongoDBCollection connection property "changeLog.exclude" should be an array of field paths.'
  );
});

test('MongoDBInsertOne logs the doc with named fields excluded', async () => {
  const record = await logOf({
    request: { doc: row('i1') },
    requestType: MongoDBInsertOne,
    requestId: 'excludeInsertOne',
  });
  expect(record.args.doc).toEqual({
    _id: 'i1',
    kind: 'email',
    summary: EXCLUDED,
    body: EXCLUDED,
    data: { thread: 't1' },
  });
  expect(record.meta).toEqual({ user: 'u1' });
});

test('a field the document does not hold stays absent', async () => {
  const record = await logOf({
    request: { doc: { _id: 'i2', kind: 'call' } },
    requestType: MongoDBInsertOne,
    requestId: 'excludeAbsent',
  });
  expect(record.args.doc).toEqual({ _id: 'i2', kind: 'call' });
});

test('MongoDBInsertMany and the consecutive-id inserts exclude the fields in every doc', async () => {
  let record = await logOf({
    request: { docs: [row('m1'), row('m2')] },
    requestType: MongoDBInsertMany,
    requestId: 'excludeInsertMany',
  });
  expect(record.args.docs.map((doc) => [doc.body, doc.summary])).toEqual([
    [EXCLUDED, EXCLUDED],
    [EXCLUDED, EXCLUDED],
  ]);
  const { _id, ...doc } = row();
  record = await logOf({
    request: { doc, prefix: 'C', length: 3 },
    requestType: MongoDBInsertConsecutiveId,
    requestId: 'excludeInsertConsecutiveId',
  });
  expect(record.args.doc.body).toBe(EXCLUDED);
  record = await logOf({
    request: { docs: [{ ...doc }, { ...doc }], prefix: 'D', length: 3 },
    requestType: MongoDBInsertManyConsecutiveIds,
    requestId: 'excludeInsertManyConsecutiveIds',
  });
  record.args.docs.forEach((logged) => expect(logged.summary).toBe(EXCLUDED));
});

test('MongoDBUpdateOne excludes the fields in before, after and every operator', async () => {
  const record = await logOf({
    request: {
      filter: { _id: 'a1' },
      update: {
        $set: { body: 'New text', summary: 'New subject', private: false },
        $setOnInsert: { created: 1 },
      },
      options: { upsert: true },
    },
    requestType: MongoDBUpdateOne,
    requestId: 'excludeUpdateOne',
  });
  expect(record.args.update).toEqual({
    $set: { body: EXCLUDED, summary: EXCLUDED, private: false },
    $setOnInsert: { created: 1 },
  });
  expect(record.before).toEqual({ ...row('a1'), body: EXCLUDED, summary: EXCLUDED });
  expect(record.after.body).toBe(EXCLUDED);
  expect(record.after.summary).toBe(EXCLUDED);
  expect(record.after.private).toBe(false);
  expectNoText(record);
});

test('MongoDBUpdateOne excludes the fields in each pipeline stage', async () => {
  const record = await logOf({
    request: {
      filter: { _id: 'a1' },
      update: [
        { $set: { body: BODY, private: false } },
        { $replaceWith: { $mergeObjects: ['$$ROOT', { summary: SUBJECT }] } },
        { $unset: ['data'] },
      ],
    },
    requestType: MongoDBUpdateOne,
    requestId: 'excludeUpdatePipeline',
  });
  expect(record.args.update).toEqual([
    { $set: { body: EXCLUDED, private: false } },
    { $replaceWith: { $mergeObjects: ['$$ROOT', { summary: EXCLUDED }] } },
    { $unset: ['data'] },
  ]);
  expectNoText(record);
});

test('MongoDBUpdateMany and MongoDBVersionedUpdateOne exclude the fields', async () => {
  let record = await logOf({
    request: { filter: {}, update: { $set: { summary: SUBJECT } } },
    requestType: MongoDBUpdateMany,
    requestId: 'excludeUpdateMany',
  });
  expect(record.args.update).toEqual({ $set: { summary: EXCLUDED } });
  record = await logOf({
    request: { filter: { _id: 'a1' }, update: { $set: { body: BODY } } },
    requestType: MongoDBVersionedUpdateOne,
    requestId: 'excludeVersionedUpdateOne',
  });
  expect(record.args.update).toEqual({ $set: { body: EXCLUDED } });
  expect(record.before.body).toBe(EXCLUDED);
  expect(record.after.body).toBe(EXCLUDED);
  expectNoText(record);
});

test("MongoDBDeleteOne excludes the deleted document's fields", async () => {
  const record = await logOf({
    request: { filter: { _id: 'a1' } },
    requestType: MongoDBDeleteOne,
    requestId: 'excludeDeleteOne',
  });
  expect(record.before).toEqual({ ...row('a1'), body: EXCLUDED, summary: EXCLUDED });
  const many = await logOf({
    request: { filter: { _id: 'a2' } },
    requestType: MongoDBDeleteMany,
    requestId: 'excludeDeleteMany',
  });
  expect(many.args.filter).toEqual({ _id: 'a2' });
});

test('MongoDBTableChanges excludes the fields in the changeset and the operations', async () => {
  const record = await logOf({
    request: {
      filter: {},
      rowKeyType: 'string',
      fields: { body: { type: 'text' }, summary: { type: 'text' }, kind: { type: 'text' } },
      changes: {
        updated: { a1: { body: 'Edited text', kind: 'email' } },
        added: [{ rowKey: 'new', summary: 'Added subject', kind: 'call' }],
      },
    },
    requestType: MongoDBTableChanges,
    requestId: 'excludeTableChanges',
  });
  expect(record.args.changes.updated).toEqual({ a1: { body: EXCLUDED, kind: 'email' } });
  expect(record.args.changes.added[0]).toEqual({ rowKey: 'new', summary: EXCLUDED, kind: 'call' });
  const text = JSON.stringify(record.args.operations);
  expect(text).not.toContain('Edited text');
  expect(text).not.toContain('Added subject');
});

test('a connection without exclude logs every value', async () => {
  const record = await logOf({
    request: { filter: { _id: 'a1' }, update: { $set: { body: 'Plain text' } } },
    requestType: MongoDBUpdateOne,
    connection: plain,
    requestId: 'excludeNone',
  });
  expect(record.args.update).toEqual({ $set: { body: 'Plain text' } });
  expect(record.before.body).toBe(BODY);
  expect(record.after.body).toBe('Plain text');
});

test('the enrichment log excludes cell values when _enrich is named', async () => {
  const records = [];
  const results = [{ rowKey: 'c1', columnKey: 'profile', status: 'ok', value: { size: 40 } }];
  for (const exclude of [['_enrich'], ['body']]) {
    await writeEnrichmentLog({
      args: { results },
      context: { connection: { changeLog: { collection: logCollection, exclude } } },
      logCollection: { insertOne: async (record) => records.push(record) },
      response: {},
      type: 'MongoDBEnrichmentComplete',
    });
  }
  expect(records[0].args.results[0]).toEqual({ ...results[0], value: EXCLUDED });
  expect(records[1].args.results[0].value).toEqual({ size: 40 });
});

test('bulk operations and replacement updates exclude the fields', () => {
  const record = excludeLogFields({
    connection: { changeLog: { collection: logCollection, exclude: ['body'] } },
    record: {
      args: {
        operations: [
          { insertOne: { document: { body: 'x', kind: 'email' } } },
          { updateOne: { filter: { _id: 1 }, update: { $set: { 'body.html': 'x' } } } },
          { replaceOne: { filter: { _id: 1 }, replacement: { body: 'x' } } },
          { deleteOne: { filter: { _id: 1 } } },
        ],
        update: { body: 'x', kind: 'email' },
      },
      after: null,
    },
  });
  expect(record).toEqual({
    args: {
      operations: [
        { insertOne: { document: { body: EXCLUDED, kind: 'email' } } },
        { updateOne: { filter: { _id: 1 }, update: { $set: { 'body.html': EXCLUDED } } } },
        { replaceOne: { filter: { _id: 1 }, replacement: { body: EXCLUDED } } },
        { deleteOne: { filter: { _id: 1 } } },
      ],
      update: { body: EXCLUDED, kind: 'email' },
    },
    after: null,
  });
});

test('a nested path and a path through an array exclude only the field they name', () => {
  const record = excludeLogFields({
    connection: {
      changeLog: { collection: logCollection, exclude: ['tokens.refresh', 'sessions.token'] },
    },
    record: {
      args: {
        doc: {
          tokens: { refresh: 'r1', expires: 5 },
          sessions: [{ token: 's1', device: 'phone' }, { device: 'laptop' }],
        },
        update: {
          $set: {
            'tokens.refresh.value': 'r2',
            tokens: { refresh: 'r3', expires: 6 },
            'sessions.$.token': 's2',
            'sessions.0.token': 's3',
            'sessions.$[].token': 's4',
            'sessions.$[s].device': 'tablet',
            'tokens.expires': 7,
          },
          $push: { sessions: { $each: [{ token: 's5', device: 'watch' }] } },
        },
      },
      before: { tokens: { expires: 5 }, sessions: [] },
      after: { tokens: { refresh: 'r3', expires: 7 }, sessions: [{ token: 's2' }] },
    },
  });
  expect(record).toEqual({
    args: {
      doc: {
        tokens: { refresh: EXCLUDED, expires: 5 },
        sessions: [{ token: EXCLUDED, device: 'phone' }, { device: 'laptop' }],
      },
      update: {
        $set: {
          'tokens.refresh.value': EXCLUDED,
          tokens: { refresh: EXCLUDED, expires: 6 },
          'sessions.$.token': EXCLUDED,
          'sessions.0.token': EXCLUDED,
          'sessions.$[].token': EXCLUDED,
          'sessions.$[s].device': 'tablet',
          'tokens.expires': 7,
        },
        $push: { sessions: { $each: [{ token: EXCLUDED, device: 'watch' }] } },
      },
    },
    before: { tokens: { expires: 5 }, sessions: [] },
    after: { tokens: { refresh: EXCLUDED, expires: 7 }, sessions: [{ token: EXCLUDED }] },
  });
});

test('MongoDBUpdateOne excludes a nested field in before, after and the update', async () => {
  const SECRET = 'sealed-refresh-token';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'c1', tokens: { refresh: SECRET, access: 'a1' }, status: 'active' }],
  });
  const record = await logOf({
    request: {
      filter: { _id: 'c1' },
      update: { $set: { 'tokens.access': 'a2', 'tokens.refresh': SECRET, status: 'active' } },
    },
    requestType: MongoDBUpdateOne,
    connection: {
      ...excluding,
      changeLog: { collection: logCollection, exclude: ['tokens.refresh', 'tokens.access'] },
    },
    requestId: 'excludeNested',
  });
  expect(JSON.stringify(record)).not.toContain(SECRET);
  expect(JSON.stringify(record)).not.toContain('a2');
  expect(record.before.tokens).toEqual({ refresh: EXCLUDED, access: EXCLUDED });
  expect(record.after.tokens).toEqual({ refresh: EXCLUDED, access: EXCLUDED });
  expect(record.after.status).toEqual('active');
});
