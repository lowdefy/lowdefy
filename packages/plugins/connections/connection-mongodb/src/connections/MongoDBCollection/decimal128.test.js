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

import { Decimal128 } from 'mongodb';
import { expect, test } from 'vitest';

import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation.js';
import MongoDBBulkWrite from './MongoDBBulkWrite/MongoDBBulkWrite.js';
import MongoDBFind from './MongoDBFind/MongoDBFind.js';
import MongoDBFindOne from './MongoDBFindOne/MongoDBFindOne.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import getWalledCollection from '../../walled/getWalledCollection.js';
import clearTestMongoDb from '../../../test/clearTestMongoDb.js';
import findLogCollectionRecordTestMongoDb from '../../../test/findLogCollectionRecordTestMongoDb.js';
import getTestCollection from '../../../test/getTestCollection.js';

// A Decimal128 crosses a request as { _decimal: '<string>' }. These tests run the stock requests
// against a real server and read the stored BSON type back with the driver, so a value that had
// become a string or a double anywhere on the way would fail them.

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const logCollection = 'decimalLogCollection';

function connectionFor(collection, extra = {}) {
  return { databaseUri, databaseName, collection, read: true, write: true, ...extra };
}

// The response as the browser or the next routine step gets it: plain JSON.
function overTheWire(response) {
  return JSON.parse(JSON.stringify(response));
}

async function readStored({ collection, pipeline }) {
  const { collection: raw, client } = await getTestCollection({ collection });
  const docs = await raw.aggregate(pipeline).toArray();
  await client.close();
  return docs;
}

async function storedTypes({ collection, field }) {
  const docs = await readStored({
    collection,
    pipeline: [{ $sort: { _id: 1 } }, { $project: { type: { $type: `$${field}` } } }],
  });
  return docs.map((doc) => doc.type);
}

test('0.1 plus 0.2 is 0.3 through an insert, an update and a find', async () => {
  const collection = 'decimalRoundTrip';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await MongoDBInsertOne({
    connection,
    request: { doc: { _id: 'sum', amount: { _decimal: '0.1' } } },
  });
  await MongoDBUpdateOne({
    connection,
    request: { filter: { _id: 'sum' }, update: { $inc: { amount: { _decimal: '0.2' } } } },
  });
  const found = await MongoDBFind({ connection, request: { query: { _id: 'sum' } } });
  expect(overTheWire(found)).toEqual([{ _id: 'sum', amount: { _decimal: '0.3' } }]);
  const one = await MongoDBFindOne({ connection, request: { query: { _id: 'sum' } } });
  expect(overTheWire(one)).toEqual({ _id: 'sum', amount: { _decimal: '0.3' } });
  expect(await storedTypes({ collection, field: 'amount' })).toEqual(['decimal']);
  // The same sum in doubles is 0.30000000000000004.
  expect(0.1 + 0.2).not.toEqual(0.3);
});

test('a read value writes back as a decimal', async () => {
  const collection = 'decimalWriteBack';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await MongoDBInsertOne({
    connection,
    request: { doc: { _id: 'first', amount: { _decimal: '19.99' } } },
  });
  const first = overTheWire(
    await MongoDBFindOne({ connection, request: { query: { _id: 'first' } } })
  );
  await MongoDBInsertOne({
    connection,
    request: { doc: { _id: 'second', amount: first.amount } },
  });
  const found = await MongoDBFind({
    connection,
    request: { query: { amount: { _decimal: '19.99' } }, options: { sort: { _id: 1 } } },
  });
  expect(found.map((doc) => doc._id)).toEqual(['first', 'second']);
  expect(await storedTypes({ collection, field: 'amount' })).toEqual(['decimal', 'decimal']);
});

test('an aggregation sums stored decimals exactly', async () => {
  const collection = 'decimalSum';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await MongoDBInsertMany({
    connection,
    request: {
      docs: [
        { _id: 1, account: 'a', amount: { _decimal: '0.1' } },
        { _id: 2, account: 'a', amount: { _decimal: '0.2' } },
        { _id: 3, account: 'b', amount: { _decimal: '1234567890123456789012345678.901234' } },
        { _id: 4, account: 'b', amount: { _decimal: '0.000001' } },
        { _id: 5, account: 'c', amount: { _decimal: '-5.25' } },
        { _id: 6, account: 'c', amount: { _decimal: '5.25' } },
      ],
    },
  });
  const res = await MongoDBAggregation({
    connection,
    request: {
      pipeline: [
        { $group: { _id: '$account', total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ],
    },
  });
  expect(overTheWire(res)).toEqual([
    { _id: 'a', total: { _decimal: '0.3' } },
    { _id: 'b', total: { _decimal: '1234567890123456789012345678.901235' } },
    { _id: 'c', total: { _decimal: '0.00' } },
  ]);
  expect(await storedTypes({ collection, field: 'amount' })).toEqual(new Array(6).fill('decimal'));
});

test('a decimal literal in a pipeline is a decimal', async () => {
  const collection = 'decimalPipelineLiteral';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await MongoDBInsertOne({
    connection,
    request: { doc: { _id: 'line', quantity: { _decimal: '3' }, price: { _decimal: '0.35' } } },
  });
  const res = await MongoDBAggregation({
    connection,
    request: {
      pipeline: [
        {
          $project: {
            total: { $add: [{ $multiply: ['$quantity', '$price'] }, { _decimal: '0.05' }] },
          },
        },
      ],
    },
  });
  expect(overTheWire(res)).toEqual([{ _id: 'line', total: { _decimal: '1.10' } }]);
});

const values = [
  '0',
  '0.00',
  '-0',
  '-12.5',
  '0.10',
  '79228162514264337593543950335',
  '1234567890123456789012345678901234',
  '-1234567890123456789012345678901234',
  '0.1234567890123456789012345678901234',
  '9.999999999999999999999999999999999E+6144',
  '1E-6176',
];

test('negative, zero, very large and 34 digit values round trip unchanged', async () => {
  const collection = 'decimalValues';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await MongoDBInsertMany({
    connection,
    request: { docs: values.map((value, _id) => ({ _id, amount: { _decimal: value } })) },
  });
  const found = await MongoDBFind({
    connection,
    request: { query: {}, options: { sort: { _id: 1 } } },
  });
  expect(overTheWire(found).map((doc) => doc.amount)).toEqual(
    values.map((value) => ({ _decimal: value }))
  );
  expect(await storedTypes({ collection, field: 'amount' })).toEqual(values.map(() => 'decimal'));
});

test('updateMany and bulkWrite write decimals', async () => {
  const collection = 'decimalManyWrites';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await MongoDBBulkWrite({
    connection,
    request: {
      operations: [
        { insertOne: { document: { _id: 1, amount: { _decimal: '1.10' } } } },
        { insertOne: { document: { _id: 2, amount: { _decimal: '2.20' } } } },
        { updateOne: { filter: { _id: 2 }, update: { $inc: { amount: { _decimal: '0.05' } } } } },
      ],
    },
  });
  await MongoDBUpdateMany({
    connection,
    request: { filter: {}, update: { $mul: { amount: { _decimal: '2' } } } },
  });
  const found = await MongoDBFind({
    connection,
    request: { query: {}, options: { sort: { _id: 1 } } },
  });
  expect(overTheWire(found)).toEqual([
    { _id: 1, amount: { _decimal: '2.20' } },
    { _id: 2, amount: { _decimal: '4.50' } },
  ]);
  expect(await storedTypes({ collection, field: 'amount' })).toEqual(['decimal', 'decimal']);
});

test('a number in the marker is refused before anything is written', async () => {
  const collection = 'decimalRefused';
  await clearTestMongoDb({ collection });
  const connection = connectionFor(collection);
  await expect(
    MongoDBInsertOne({ connection, request: { doc: { _id: 'bad', amount: { _decimal: 0.1 } } } })
  ).rejects.toThrow('_decimal takes a decimal as a string');
  expect(await readStored({ collection, pipeline: [] })).toEqual([]);
});

test('the change log keeps decimals as decimals', async () => {
  const collection = 'decimalChangeLog';
  await clearTestMongoDb({ collection });
  await clearTestMongoDb({ collection: logCollection });
  const connection = connectionFor(collection, { changeLog: { collection: logCollection } });
  await MongoDBInsertOne({
    connection,
    requestId: 'decimal_insert',
    request: { doc: { _id: 'logged', amount: { _decimal: '0.1' } } },
  });
  await MongoDBUpdateOne({
    connection,
    requestId: 'decimal_update',
    request: { filter: { _id: 'logged' }, update: { $inc: { amount: { _decimal: '0.2' } } } },
  });
  const insertRecord = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'decimal_insert',
  });
  expect(insertRecord.args.doc.amount).toBeInstanceOf(Decimal128);
  expect(insertRecord.args.doc.amount.toString()).toEqual('0.1');
  const updateRecord = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'decimal_update',
  });
  expect(updateRecord.args.update.$inc.amount).toBeInstanceOf(Decimal128);
  expect(updateRecord.args.update.$inc.amount.toString()).toEqual('0.2');
  expect(updateRecord.before.amount).toBeInstanceOf(Decimal128);
  expect(updateRecord.before.amount.toString()).toEqual('0.1');
  expect(updateRecord.after.amount).toBeInstanceOf(Decimal128);
  expect(updateRecord.after.amount.toString()).toEqual('0.3');
  const logTypes = await readStored({
    collection: logCollection,
    pipeline: [
      { $match: { requestId: 'decimal_update' } },
      {
        $project: {
          _id: 0,
          before: { $type: '$before.amount' },
          after: { $type: '$after.amount' },
        },
      },
    ],
  });
  expect(logTypes).toEqual([{ before: 'decimal', after: 'decimal' }]);
});

test('the walled client takes and returns Decimal128 values', async () => {
  const collection = 'decimalWalled';
  await clearTestMongoDb({ collection });
  await clearTestMongoDb({ collection: logCollection });
  const walled = getWalledCollection({
    connection: connectionFor(collection, { changeLog: { collection: logCollection } }),
    connectionId: 'walled',
    requestId: 'decimal_walled',
    tenant: { field: 'organization_id', value: 'org_a' },
  });
  const amount = Decimal128.fromString('0.1');
  const doc = { _id: 'w1', amount };
  await walled.insertOne(doc);
  // The plugin's own document still holds its Decimal128.
  expect(doc.amount).toBe(amount);
  await walled.updateOne({ _id: 'w1' }, { $inc: { amount: Decimal128.fromString('0.2') } });
  const found = await walled.findOne({ _id: 'w1' });
  expect(found.amount).toBeInstanceOf(Decimal128);
  expect(found.amount.toString()).toEqual('0.3');
  const updated = await walled.findOneAndUpdate(
    { _id: 'w1', amount: Decimal128.fromString('0.3') },
    { $inc: { amount: Decimal128.fromString('0.7') } },
    { returnDocument: 'after' }
  );
  expect(updated.amount).toBeInstanceOf(Decimal128);
  expect(updated.amount.toString()).toEqual('1.0');
  expect(await walled.countDocuments({ amount: Decimal128.fromString('1.0') })).toEqual(1);
  const totals = await walled.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
  expect(totals[0].total).toBeInstanceOf(Decimal128);
  expect(totals[0].total.toString()).toEqual('1.0');
  expect(await storedTypes({ collection, field: 'amount' })).toEqual(['decimal']);
  const { collection: rawLog, client } = await getTestCollection({ collection: logCollection });
  const records = await rawLog.find({ requestId: 'decimal_walled' }).toArray();
  await client.close();
  expect(records.length).toBeGreaterThan(0);
  records.forEach((record) => {
    if (record.after) {
      expect(record.after.amount).toBeInstanceOf(Decimal128);
    }
  });
});
