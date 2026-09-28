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

// The unique indexes the engine relies on for auth invariants BetterAuth
// checks only by reading first - one organization per slug, one member row
// per (user, organization) - so two concurrent writers can not both pass the
// read and both write. The engine names them in BetterAuth terms (model and
// logical field names); the adapter maps them to its collections and snake_case
// fields and creates each one unless an equivalent unique index already exists.
// createIndex is idempotent, but an equivalent index under another name (one
// an operator created by hand) would make it fail, so the existing indexes are
// read first: any unique, non-partial index over the same fields satisfies the
// invariant.

// NamespaceNotFound: listing the indexes of a collection that does not exist.
const namespaceNotFound = 26;

function isEquivalentUniqueIndex({ index, keys }) {
  if (index.unique !== true || index.partialFilterExpression !== undefined) {
    return false;
  }
  const indexFields = Object.keys(index.key ?? {}).sort();
  const fields = Object.keys(keys).sort();
  return (
    indexFields.length === fields.length &&
    indexFields.every((field, position) => field === fields[position])
  );
}

async function listIndexes({ collection }) {
  try {
    return await collection.indexes();
  } catch (error) {
    if (error.code === namespaceNotFound) {
      return [];
    }
    throw error;
  }
}

function createEnsureUniqueIndexes({ getDb, getFieldName, getModelName }) {
  return async function ensureUniqueIndexes({ indexes }) {
    const db = await getDb();
    for (const { model, fields } of indexes) {
      const collectionName = getModelName(model);
      const collection = db.collection(collectionName);
      const keys = Object.fromEntries(fields.map((field) => [getFieldName({ model, field }), 1]));
      const existing = await listIndexes({ collection });
      if (existing.some((index) => isEquivalentUniqueIndex({ index, keys }))) {
        continue;
      }
      try {
        await collection.createIndex(keys, {
          unique: true,
          name: `lowdefy_unique_${Object.keys(keys).join('_')}`,
        });
      } catch (error) {
        throw new Error(
          `Could not create the unique index on collection "${collectionName}" over ${JSON.stringify(
            Object.keys(keys)
          )}: ${error.message}`,
          { cause: error }
        );
      }
    }
  };
}

export default createEnsureUniqueIndexes;
