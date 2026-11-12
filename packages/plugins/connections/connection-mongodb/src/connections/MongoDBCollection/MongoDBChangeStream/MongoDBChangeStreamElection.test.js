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

import { afterAll, beforeAll, expect, test } from 'vitest';
import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server-core';

import MongoDBChangeStream from './MongoDBChangeStream.js';

// A replica set of its own: stepping the primary down would interrupt every other test file
// on the shared one.
let replSet;
let client;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    // Test commands enable the failCommand failpoint.
    instanceOpts: Array.from({ length: 3 }, () => ({
      args: ['--setParameter', 'enableTestCommands=1'],
    })),
    replSet: { count: 3, dbName: 'test', storageEngine: 'wiredTiger' },
  });
  await replSet.waitUntilRunning();
  client = new MongoClient(replSet.getUri());
  await client.connect();
}, 120000);

afterAll(async () => {
  await client?.close();
  await replSet?.stop();
});

async function waitFor(check, timeoutMs) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting.');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function insertOnPrimary(document) {
  // The write retries through the election, so it lands once a new primary is up.
  await client.db('test').collection('election').insertOne(document);
}

test('MongoDBChangeStream resumes when getMore fails with 11602 and no resumable label', async () => {
  // What production saw: the server answered 11602 without the ResumableChangeStreamError
  // label, so the driver did not resume the stream itself.
  const abortController = new AbortController();
  const published = [];
  let runError = null;
  const run = MongoDBChangeStream({
    connection: {
      databaseUri: replSet.getUri(),
      databaseName: 'test',
      collection: 'failpoint',
      options: { appName: 'changeStreamFailpoint' },
    },
    properties: { pipeline: [{ $match: { operationType: 'insert' } }] },
    publish: ({ data }) => published.push(data),
    signal: abortController.signal,
  }).catch((error) => {
    runError = error;
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  await client.db('test').collection('failpoint').insertOne({ name: 'before' });
  await waitFor(() => published.length === 1, 10000);

  await client.db('admin').command({
    configureFailPoint: 'failCommand',
    mode: { times: 1 },
    data: {
      failCommands: ['getMore'],
      errorCode: 11602,
      errorLabels: [],
      appName: 'changeStreamFailpoint',
    },
  });
  // Let the failed getMore end the first stream before the next write.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await client.db('test').collection('failpoint').insertOne({ name: 'after' });
  await waitFor(() => published.length === 2 || runError !== null, 10000);

  abortController.abort();
  await run;
  expect(runError).toBeNull();
  expect(published.map((change) => change.fullDocument.name)).toEqual(['before', 'after']);
}, 60000);

test('MongoDBChangeStream carries on when the primary steps down', async () => {
  const abortController = new AbortController();
  const published = [];
  let runError = null;
  const run = MongoDBChangeStream({
    connection: { databaseUri: replSet.getUri(), databaseName: 'test', collection: 'election' },
    properties: { pipeline: [{ $match: { operationType: 'insert' } }] },
    publish: ({ data }) => published.push(data),
    signal: abortController.signal,
  }).catch((error) => {
    runError = error;
  });

  // Give the stream time to open before the first write.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await insertOnPrimary({ name: 'before' });
  await waitFor(() => published.length === 1, 10000);

  const { primary } = await client.db('admin').command({ hello: 1 });
  await client
    .db('admin')
    .command({ replSetStepDown: 10, secondaryCatchUpPeriodSecs: 5 })
    .catch(() => {
      // The primary drops its connections as it steps down.
    });
  let newPrimary = primary;
  const startWait = Date.now();
  while (newPrimary === primary && Date.now() - startWait < 30000) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    ({ primary: newPrimary } = await client.db('admin').command({ hello: 1 }));
  }
  expect(newPrimary).not.toEqual(primary);

  await insertOnPrimary({ name: 'after' });
  await waitFor(() => published.length === 2 || runError !== null, 45000);

  abortController.abort();
  await run;
  expect(runError).toBeNull();
  expect(published.map((change) => change.fullDocument.name)).toEqual(['before', 'after']);
}, 120000);
