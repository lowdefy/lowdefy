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

import { validate } from '@lowdefy/ajv';

import connectionSchema from './schema.js';
import omitLogFields from './omitLogFields.js';
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
const collection = 'changeLogOmit';
const logCollection = 'changeLogOmitLog';
const OMITTED = '[omitted]';
const BODY = 'The quote is attached, phase one.';
const SUBJECT = 'Quote for phase one';

const omitting = {
  databaseUri,
  databaseName,
  collection,
  write: true,
  changeLog: { collection: logCollection, meta: { user: 'u1' }, omit: ['body', 'summary'] },
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

async function logOf({ request, requestType, connection = omitting, requestId }) {
  await requestType({ request, connection, connectionId: 'rows', requestId, payload: {} });
  return findLogCollectionRecordTestMongoDb({ logCollection, requestId });
}

function expectNoText(record) {
  const text = JSON.stringify(record);
  expect(text).not.toContain(BODY);
  expect(text).not.toContain(SUBJECT);
}

beforeEach(() => populateTestMongoDb({ collection, documents: [row('a1'), row('a2')] }));

test('the connection schema takes changeLog.omit', () => {
  expect(validate({ schema: connectionSchema, data: omitting })).toEqual({ valid: true });
  expect(() =>
    validate({
      schema: connectionSchema,
      data: { ...omitting, changeLog: { collection: logCollection, omit: 'body' } },
    })
  ).toThrow(
    'MongoDBCollection connection property "changeLog.omit" should be an array of field names.'
  );
});

test('MongoDBInsertOne logs the doc with named fields omitted', async () => {
  const record = await logOf({
    request: { doc: row('i1') },
    requestType: MongoDBInsertOne,
    requestId: 'omitInsertOne',
  });
  expect(record.args.doc).toEqual({
    _id: 'i1',
    kind: 'email',
    summary: OMITTED,
    body: OMITTED,
    data: { thread: 't1' },
  });
  expect(record.meta).toEqual({ user: 'u1' });
});

test('a field the document does not hold stays absent', async () => {
  const record = await logOf({
    request: { doc: { _id: 'i2', kind: 'call' } },
    requestType: MongoDBInsertOne,
    requestId: 'omitAbsent',
  });
  expect(record.args.doc).toEqual({ _id: 'i2', kind: 'call' });
});

test('MongoDBInsertMany and the consecutive-id inserts omit the fields in every doc', async () => {
  let record = await logOf({
    request: { docs: [row('m1'), row('m2')] },
    requestType: MongoDBInsertMany,
    requestId: 'omitInsertMany',
  });
  expect(record.args.docs.map((doc) => [doc.body, doc.summary])).toEqual([
    [OMITTED, OMITTED],
    [OMITTED, OMITTED],
  ]);
  const { _id, ...doc } = row();
  record = await logOf({
    request: { doc, prefix: 'C', length: 3 },
    requestType: MongoDBInsertConsecutiveId,
    requestId: 'omitInsertConsecutiveId',
  });
  expect(record.args.doc.body).toBe(OMITTED);
  record = await logOf({
    request: { docs: [{ ...doc }, { ...doc }], prefix: 'D', length: 3 },
    requestType: MongoDBInsertManyConsecutiveIds,
    requestId: 'omitInsertManyConsecutiveIds',
  });
  record.args.docs.forEach((logged) => expect(logged.summary).toBe(OMITTED));
});

test('MongoDBUpdateOne omits the fields in before, after and every operator', async () => {
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
    requestId: 'omitUpdateOne',
  });
  expect(record.args.update).toEqual({
    $set: { body: OMITTED, summary: OMITTED, private: false },
    $setOnInsert: { created: 1 },
  });
  expect(record.before).toEqual({ ...row('a1'), body: OMITTED, summary: OMITTED });
  expect(record.after.body).toBe(OMITTED);
  expect(record.after.summary).toBe(OMITTED);
  expect(record.after.private).toBe(false);
  expectNoText(record);
});

test('MongoDBUpdateOne omits the fields in each pipeline stage', async () => {
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
    requestId: 'omitUpdatePipeline',
  });
  expect(record.args.update).toEqual([
    { $set: { body: OMITTED, private: false } },
    { $replaceWith: { $mergeObjects: ['$$ROOT', { summary: OMITTED }] } },
    { $unset: ['data'] },
  ]);
  expectNoText(record);
});

test('MongoDBUpdateMany and MongoDBVersionedUpdateOne omit the fields', async () => {
  let record = await logOf({
    request: { filter: {}, update: { $set: { summary: SUBJECT } } },
    requestType: MongoDBUpdateMany,
    requestId: 'omitUpdateMany',
  });
  expect(record.args.update).toEqual({ $set: { summary: OMITTED } });
  record = await logOf({
    request: { filter: { _id: 'a1' }, update: { $set: { body: BODY } } },
    requestType: MongoDBVersionedUpdateOne,
    requestId: 'omitVersionedUpdateOne',
  });
  expect(record.args.update).toEqual({ $set: { body: OMITTED } });
  expect(record.before.body).toBe(OMITTED);
  expect(record.after.body).toBe(OMITTED);
  expectNoText(record);
});

test("MongoDBDeleteOne omits the deleted document's fields", async () => {
  const record = await logOf({
    request: { filter: { _id: 'a1' } },
    requestType: MongoDBDeleteOne,
    requestId: 'omitDeleteOne',
  });
  expect(record.before).toEqual({ ...row('a1'), body: OMITTED, summary: OMITTED });
  const many = await logOf({
    request: { filter: { _id: 'a2' } },
    requestType: MongoDBDeleteMany,
    requestId: 'omitDeleteMany',
  });
  expect(many.args.filter).toEqual({ _id: 'a2' });
});

test('MongoDBTableChanges omits the fields in the changeset and the operations', async () => {
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
    requestId: 'omitTableChanges',
  });
  expect(record.args.changes.updated).toEqual({ a1: { body: OMITTED, kind: 'email' } });
  expect(record.args.changes.added[0]).toEqual({ rowKey: 'new', summary: OMITTED, kind: 'call' });
  const text = JSON.stringify(record.args.operations);
  expect(text).not.toContain('Edited text');
  expect(text).not.toContain('Added subject');
});

test('a connection without omit logs every value', async () => {
  const record = await logOf({
    request: { filter: { _id: 'a1' }, update: { $set: { body: 'Plain text' } } },
    requestType: MongoDBUpdateOne,
    connection: plain,
    requestId: 'omitNone',
  });
  expect(record.args.update).toEqual({ $set: { body: 'Plain text' } });
  expect(record.before.body).toBe(BODY);
  expect(record.after.body).toBe('Plain text');
});

test('the enrichment log omits cell values when _enrich is named', async () => {
  const records = [];
  const results = [{ rowKey: 'c1', columnKey: 'profile', status: 'ok', value: { size: 40 } }];
  for (const omit of [['_enrich'], ['body']]) {
    await writeEnrichmentLog({
      args: { results },
      context: { connection: { changeLog: { collection: logCollection, omit } } },
      logCollection: { insertOne: async (record) => records.push(record) },
      response: {},
      type: 'MongoDBEnrichmentComplete',
    });
  }
  expect(records[0].args.results[0]).toEqual({ ...results[0], value: OMITTED });
  expect(records[1].args.results[0].value).toEqual({ size: 40 });
});

test('bulk operations and replacement updates omit the fields', () => {
  const record = omitLogFields({
    connection: { changeLog: { collection: logCollection, omit: ['body'] } },
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
        { insertOne: { document: { body: OMITTED, kind: 'email' } } },
        { updateOne: { filter: { _id: 1 }, update: { $set: { 'body.html': OMITTED } } } },
        { replaceOne: { filter: { _id: 1 }, replacement: { body: OMITTED } } },
        { deleteOne: { filter: { _id: 1 } } },
      ],
      update: { body: OMITTED, kind: 'email' },
    },
    after: null,
  });
});
