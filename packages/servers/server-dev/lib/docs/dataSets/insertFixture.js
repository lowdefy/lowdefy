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

import { type } from '@lowdefy/helpers';

import deserializeFixture from './deserializeFixture.js';

const DUPLICATE_KEY = 11000;

function indexNameFrom(error) {
  const match = /index: (\S+)/.exec(error.message ?? '');
  return match === null ? 'unknown' : match[1];
}

// A fixture that breaks a unique index fails the load, naming the fixture, the index, the duplicate
// key and the document that already holds it. Loading indexes before documents is what lets this
// catch a fixture that collides with an earlier one.
async function describeDuplicate({ collection, dataSetName, fixture, error }) {
  const holder = type.isObject(error.keyValue)
    ? await collection.findOne(error.keyValue, { projection: { _id: 1 } })
    : null;
  const where = `Data set "${dataSetName}" fixture ${fixture.connectionId}[${fixture.index}]`;
  const heldBy = type.isNone(holder) ? '' : ` held by document _id ${JSON.stringify(holder._id)}`;
  return new Error(
    `${where} breaks unique index "${indexNameFrom(error)}": duplicate key ${JSON.stringify(
      error.keyValue
    )}${heldBy}.`
  );
}

// A fixture with an _id replaces any earlier document with that _id; one without is inserted.
async function insertFixture({ collection, dataSetName, fixture }) {
  const document = deserializeFixture(fixture.document);
  try {
    if (type.isUndefined(document._id)) {
      await collection.insertOne(document);
      return;
    }
    await collection.replaceOne({ _id: document._id }, document, { upsert: true });
  } catch (error) {
    if (error.code === DUPLICATE_KEY) {
      throw await describeDuplicate({ collection, dataSetName, fixture, error });
    }
    throw error;
  }
}

export default insertFixture;
