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
import { ConfigError } from '@lowdefy/errors';
import { getOperatorType, type } from '@lowdefy/helpers';

import collectExceptions from '../../utils/collectExceptions.js';
import collectWalledSites from './collectWalledSites.js';

// The request types this rule knows how to read a written document out of.
// A request type outside this list is not audited: the rule would have to
// guess where the document lives in its properties.
export const INSERT_REQUEST_TYPES = [
  'MongoDBInsertOne',
  'MongoDBInsertMany',
  'MongoDBInsertConsecutiveId',
  'MongoDBInsertManyConsecutiveIds',
];
export const UPSERT_REQUEST_TYPES = [
  'MongoDBUpdateOne',
  'MongoDBUpdateMany',
  'MongoDBVersionedUpdateOne',
];

function hasTopLevelKey(value, field) {
  return type.isObject(value) && Object.keys(value).includes(field);
}

// Every document the site writes, or null when one of them is an operator
// node - the walk can not see what the operator produces, so the site is
// skipped rather than guessed at.
function collectWrittenDocuments({ requestType, properties }) {
  if (INSERT_REQUEST_TYPES.includes(requestType)) {
    const docs = type.isUndefined(properties.docs) ? [properties.doc] : properties.docs;
    if (!type.isArray(docs)) return null;
    if (docs.some((doc) => getOperatorType(doc) !== null || !type.isObject(doc))) return null;
    return docs;
  }
  if (UPSERT_REQUEST_TYPES.includes(requestType) && properties.options?.upsert === true) {
    const { update, filter } = properties;
    if (!type.isObject(update) || getOperatorType(update) !== null) return null;
    if (getOperatorType(filter) !== null) return null;
    // An upsert inserts the merge of $set, $setOnInsert and the filter's
    // top-level equality fields, so the field on any one of them is enough.
    const stamped = [update.$set, update.$setOnInsert, filter].filter(type.isObject);
    if (stamped.some((part) => getOperatorType(part) !== null)) return null;
    return [Object.assign({}, ...stamped)];
  }
  return [];
}

// F4: a `tenant: none` write whose document carries no tenant field. The wall
// would have stamped it; with the wall off the row belongs to no organization
// and no walled read will ever return it.
//
// Literal config only: a document or update composed by an operator is
// invisible to a static walk, so a site whose document is an operator node is
// skipped rather than guessed at.
function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant !== 'none') return;
    const documents = collectWrittenDocuments(site);
    if (documents === null) return;
    const missing = documents.some((doc) => !hasTopLevelKey(doc, site.field));
    if (!missing) return;
    collectExceptions(
      context,
      new ConfigError(
        `${site.location} declares "tenant: none" and inserts a document without "${site.field}". The row would belong to no organization and be invisible to every walled read. Add the field, or scope the step with runAs.`,
        { configKey: site.configKey, checkSlug: 'tenant-unstamped-write' }
      )
    );
  });
}

const noneWriteWithoutTenantField = {
  slug: 'tenant-unstamped-write',
  checkOnly: true,
  run,
};

export default noneWriteWithoutTenantField;
