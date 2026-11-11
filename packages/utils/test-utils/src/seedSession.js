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

import getSessionCollection from './getSessionCollection.js';

// Inserts documents into a connection's collection, for what a test builds in code on top of
// its data set. The documents are stored as given, through the raw driver: no tenant stamp and
// no change stamp is added, so a test that needs one writes it. reset() removes them.
async function seedSession({ connectionId, docs, testSession }) {
  if (!type.isArray(docs)) {
    throw new Error(
      `seed takes an array of documents. Received ${JSON.stringify(
        docs
      )} for connection "${connectionId}".`
    );
  }
  const collection = await getSessionCollection({ connectionId, testSession });
  if (docs.length > 0) {
    await collection.insertMany(docs);
  }
}

export default seedSession;
