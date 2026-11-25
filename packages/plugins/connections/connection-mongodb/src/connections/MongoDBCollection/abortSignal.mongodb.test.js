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

import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, expect, test } from 'vitest';

import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation.js';
import MongoDBFind from './MongoDBFind/MongoDBFind.js';
import MongoDBFindOne from './MongoDBFindOne/MongoDBFindOne.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

// A request the server's request timeout answers aborts its signal (context.signal). The read
// requests hand that signal to the driver, which stops waiting and closes the connection the
// operation runs on, so MongoDB stops the operation instead of running it to the end.

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'abort_signal';
const connection = { databaseUri, databaseName, collection, read: true };
const documents = Array.from({ length: 100 }, (_, i) => ({ _id: i }));

// Each document takes 100ms, so a full pass takes 10s: far past the abort.
const slowExpr = {
  $function: { body: 'function() { sleep(100); return true; }', args: [], lang: 'js' },
};

let client;

beforeAll(async () => {
  await populateTestMongoDb({ collection, documents });
  client = new MongoClient(databaseUri);
  await client.connect();
});

afterAll(async () => {
  await client.close();
});

function timeoutReason() {
  return new DOMException('The request timeout of 300ms was exceeded.', 'TimeoutError');
}

// The operations on the server whose command carries this comment, from its operation list.
async function runningOps(comment) {
  return client
    .db('admin')
    .aggregate([{ $currentOp: { allUsers: true } }, { $match: { 'command.comment': comment } }])
    .toArray();
}

async function waitFor(check, { timeoutMs = 5000 } = {}) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

async function expectStoppedOnServer({ comment, run }) {
  const controller = new AbortController();
  const pending = run({ signal: controller.signal }).catch((error) => error);
  // The operation is running on the server before the request times out.
  expect(await waitFor(async () => (await runningOps(comment)).length > 0)).toBe(true);
  const abortedAt = Date.now();
  const reason = timeoutReason();
  controller.abort(reason);
  const error = await pending;
  // The request gives up at once, with the signal's reason, which the request layer reads as
  // a cancellation.
  expect(error).toBe(reason);
  expect(Date.now() - abortedAt).toBeLessThan(1000);
  // And the server stops the operation, well before its 10s pass would end.
  expect(await waitFor(async () => (await runningOps(comment)).length === 0)).toBe(true);
}

test('an aborted aggregation stops on the server', async () => {
  const comment = 'ldf_393_aggregation';
  await expectStoppedOnServer({
    comment,
    run: ({ signal }) =>
      MongoDBAggregation({
        request: { pipeline: [{ $match: { $expr: slowExpr } }], options: { comment } },
        connection,
        signal,
      }),
  });
});

test('an aborted find stops on the server', async () => {
  const comment = 'ldf_393_find';
  await expectStoppedOnServer({
    comment,
    run: ({ signal }) =>
      MongoDBFind({
        request: { query: { $expr: slowExpr }, options: { comment } },
        connection,
        signal,
      }),
  });
});

test('an aborted findOne stops on the server', async () => {
  const comment = 'ldf_393_find_one';
  await expectStoppedOnServer({
    comment,
    run: ({ signal }) =>
      MongoDBFindOne({
        request: { query: { $expr: slowExpr, _id: 99 }, options: { comment } },
        connection,
        signal,
      }),
  });
});

test('an aggregation whose request already timed out does not run', async () => {
  const controller = new AbortController();
  const reason = timeoutReason();
  controller.abort(reason);
  await expect(
    MongoDBAggregation({ request: { pipeline: [] }, connection, signal: controller.signal })
  ).rejects.toBe(reason);
});

test('reads with no signal run as before', async () => {
  const res = await MongoDBFind({ request: { query: { _id: 1 } }, connection });
  expect(res).toEqual([{ _id: 1 }]);
  const aggregated = await MongoDBAggregation({
    request: { pipeline: [{ $count: 'n' }] },
    connection,
  });
  expect(aggregated).toEqual([{ n: 100 }]);
});
