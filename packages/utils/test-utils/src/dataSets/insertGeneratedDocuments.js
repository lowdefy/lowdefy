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

import deserializeFixture from './deserializeFixture.js';
import duplicateIndexName from './duplicateIndexName.js';

const DUPLICATE_KEY = 11000;

// One connection's generated documents, in one ordered insert: a document that breaks a unique
// index stops the load, naming the document and the index.
async function insertGeneratedDocuments({ collection, dataSetName, batch }) {
  const documents = batch.documents.map((document) => deserializeFixture(document));
  try {
    await collection.insertMany(documents, { ordered: true });
  } catch (error) {
    if (error.code !== DUPLICATE_KEY) throw error;
    // An ordered insert stops at its first failure, so the bulk error holds one write error.
    const [{ index, errmsg }] = error.writeErrors;
    const duplicate = /dup key: (.*)$/.exec(errmsg)?.[1] ?? 'unknown';
    throw new Error(
      `Data set "${dataSetName}" generated ${batch.connectionId}[${index}] (_id ${JSON.stringify(
        documents[index]._id
      )}) breaks unique index "${duplicateIndexName(errmsg)}": duplicate key ${duplicate}.`
    );
  }
}

export default insertGeneratedDocuments;
