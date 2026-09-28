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
// The response: row counts and the key each added row got, by its temporary browser key.
// Collection mode counts rows (one operation per row). In array mode every operation matches
// the one document, so matchedCount and modifiedCount are 0 or 1 for it, and insertedCount
// and deletedCount are the items pushed and the keys pulled. An array document outside the
// filter matches no operation, and nothing is written: that is an error, not an empty save.
function readChangesResult({ compiled, result }) {
  if (compiled.mode === 'collection') {
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      insertedCount: result.insertedCount,
      deletedCount: result.deletedCount,
      insertedKeys: compiled.insertedKeys,
    };
  }
  if (result.matchedCount === 0) {
    throw new Error(
      'MongoDBTableChanges found no document with "array.documentId" inside "filter", so nothing was written.'
    );
  }
  return {
    matchedCount: 1,
    modifiedCount: result.modifiedCount > 0 ? 1 : 0,
    insertedCount: compiled.insertedCount,
    deletedCount: compiled.removedCount,
    insertedKeys: compiled.insertedKeys,
  };
}

export default readChangesResult;
