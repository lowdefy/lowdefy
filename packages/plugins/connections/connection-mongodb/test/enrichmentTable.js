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

import getTestCollection from './getTestCollection.js';
import populateTestMongoDb from './populateTestMongoDb.js';

// A leads table for the enrichment request tests: a company name and domain typed by users,
// an email found by a provider from the domain, and an ai pitch from the name and the email.
const fields = {
  name: { type: 'text', search: true },
  domain: { type: 'url' },
  size: { type: 'number' },
  email: { type: 'email', path: '_enrich.email.value' },
};

const columnDefs = [
  { key: 'name', title: 'Name', type: 'text' },
  { key: 'domain', title: 'Domain', type: 'url' },
  { key: 'size', title: 'Size', type: 'number' },
  {
    key: 'email',
    title: 'Email',
    kind: 'enrichment',
    provider: 'finder',
    inputs: { domain: { column: 'domain' } },
  },
  {
    key: 'pitch',
    title: 'Pitch',
    kind: 'ai',
    prompt: 'Write a pitch for {{ name }} to {{ email }}',
    inputs: { name: { column: 'name' }, email: { column: 'email' } },
    autoRun: true,
  },
];

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';

let run = 0;

// Each test file passes its own name, since jest runs the files in parallel on one server.
async function setupEnrichmentCollection({ documents, name, changeLog = false }) {
  run += 1;
  const collection = `${name}${run}`;
  const logCollection = `${collection}Log`;
  await populateTestMongoDb({ collection, documents });
  const connection = { databaseUri, databaseName, collection, read: true, write: true };
  if (changeLog) connection.changeLog = { collection: logCollection };
  return { collection, connection, logCollection };
}

async function readDocuments(collection) {
  const { client, collection: testCollection } = await getTestCollection({ collection });
  try {
    return await testCollection.find({}).sort({ _id: 1 }).toArray();
  } finally {
    await client.close();
  }
}

async function updateDocuments(collection, filter, update) {
  const { client, collection: testCollection } = await getTestCollection({ collection });
  try {
    await testCollection.updateMany(filter, update);
  } finally {
    await client.close();
  }
}

export { columnDefs, fields, readDocuments, setupEnrichmentCollection, updateDocuments };
