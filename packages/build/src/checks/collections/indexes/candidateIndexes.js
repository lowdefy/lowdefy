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
import { ConfigWarning } from '@lowdefy/errors';

import candidateSignature from './candidateSignature.js';
import collectQuerySites from './collectQuerySites.js';
import deriveCandidates from './deriveCandidates.js';
import describeQuery from './describeQuery.js';
import indexCovers from './indexCovers.js';
import keysLiteral from './keysLiteral.js';

// `collections.<name>.indexes` was a declaration with no reader: nothing
// created the indexes and nothing checked them against the app's own queries,
// so an index could be dropped by a database-side tool and the only symptom
// was a job that used to finish timing out. The app knows every query it
// authors, so it can say which indexes those queries need.
//
// This is a heuristic and always a warning: the check runs offline, cannot see
// the collection's real indexes or its cardinality, and an index that looks
// unused here may be serving a consumer outside the app. It reads the
// declaration, never the database, and it never suggests dropping anything -
// the drop stance is documented
// in packages/docs/concepts/collections.yaml.

// A single-field equality on a field named like a key is almost always a
// point lookup the author will index deliberately, often unique. Warning on
// every one of them would bury the compound suggestions that matter, so they
// are informational.
const KEY_FIELD = /(^|_)(id|uuid|slug|key|email|code|token|ref)$/i;

function isKeyLookup(candidate) {
  return (
    candidate.equality.length === 1 &&
    candidate.sort.length === 0 &&
    candidate.range.length === 0 &&
    KEY_FIELD.test(candidate.equality[0].field)
  );
}

// The tenant wall merges `{ <field>: value }` into every filter and injects a
// leading $match into every pipeline at runtime, so the index the database is
// asked for has a key the config does not show.
function applyTenantField({ candidate, field }) {
  if (type.isUndefined(field)) return candidate;
  const named = [...candidate.equality, ...candidate.sort, ...candidate.range];
  if (named.some((key) => key.field === field)) return candidate;
  return {
    ...candidate,
    equality: [...candidate.equality, { field, direction: 1 }].sort((a, b) =>
      a.field.localeCompare(b.field)
    ),
  };
}

function run({ components, context }) {
  if (components.collections === undefined) return;
  const bindings = new Map();
  (context.connectionCollections ?? []).forEach((binding) => {
    if (type.isUndefined(binding.collection)) return;
    bindings.set(binding.connectionId, binding);
  });
  const sites = collectQuerySites({ components, connectionCollections: bindings });

  const suggestions = new Map();
  const usedIndexes = new Set();
  const keyLookups = [];

  sites.forEach((site) => {
    deriveCandidates({ properties: site.properties }).forEach((derived) => {
      const collectionName = derived.collection ?? site.collection;
      const collection = context.collections[collectionName];
      // An undeclared collection is the collections-undeclared rule's report;
      // suggesting an index on a collection with nowhere to declare it is not.
      if (type.isUndefined(collection)) return;
      const candidate = type.isUndefined(derived.collection)
        ? applyTenantField({
            candidate: derived,
            field: context.tenantConnections?.get(site.connectionId)?.field,
          })
        : derived;
      const covering = collection.indexes.findIndex((index) => indexCovers({ index, candidate }));
      if (covering !== -1) {
        usedIndexes.add(`${collectionName}|${covering}`);
        return;
      }
      if (isKeyLookup(candidate)) {
        keyLookups.push({ collectionName, candidate, site });
        return;
      }
      const key = `${collectionName}|${candidateSignature(candidate)}`;
      const suggestion = suggestions.get(key) ?? { collectionName, candidate, sites: [] };
      suggestion.sites.push(site);
      suggestions.set(key, suggestion);
    });
  });

  suggestions.forEach(({ collectionName, candidate, sites: querySites }) => {
    const [first, ...rest] = querySites;
    const more = rest.length === 0 ? '' : ` (and ${rest.length} more site(s))`;
    context.handleWarning(
      new ConfigWarning(
        `Collection "${collectionName}" is queried with ${describeQuery(candidate)} by ${
          first.location
        }${more}, and no declared index covers it. Declare it under collections.${collectionName}.indexes as { keys: ${keysLiteral(
          candidate
        )} } and create it with a MongoDBCreateIndexes step in a migration. Nothing is dropped for you — an index is removed by hand, and only when no query needs it.`,
        { configKey: first.configKey, checkSlug: 'collections-index' }
      )
    );
  });

  keyLookups.forEach(({ collectionName, candidate, site }) => {
    context.logger.debug(
      `Collection "${collectionName}" is looked up by "${candidate.equality[0].field}" at ${
        site.location
      }, which no declared index covers. If that field is a key, declare { keys: ${keysLiteral(
        candidate
      )}, options: { unique: true } }.`
    );
  });

  Object.keys(context.collections).forEach((collectionName) => {
    context.collections[collectionName].indexes.forEach((index, position) => {
      if (usedIndexes.has(`${collectionName}|${position}`)) return;
      context.logger.debug(
        `Collection "${collectionName}" declares index ${JSON.stringify(
          index.keys
        )}, which no query in this app uses. It may serve a consumer outside the app, so it is not a warning and is never dropped for you.`
      );
    });
  });
}

const candidateIndexes = {
  slug: 'collections-index',
  checkOnly: true,
  run,
};

export default candidateIndexes;
