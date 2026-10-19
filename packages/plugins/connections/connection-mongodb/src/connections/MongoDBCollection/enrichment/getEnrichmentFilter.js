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
import { type } from '@lowdefy/helpers';

import getFilterScope from '../MongoDBTableChanges/getFilterScope.js';
import pathsOverlap from '../MongoDBTableChanges/pathsOverlap.js';

// Every enrichment read and write is scoped by `filter`, as MongoDBTableChanges writes are:
// required unless the connection is tenant-scoped, and `filter: {}` asks for every document
// of the collection. The filter may not name `_enrich`, which the requests write, so no run
// can move a row in or out of scope.
function getEnrichmentFilter({ filter, tenantScoped, requestType }) {
  if (type.isNone(filter)) {
    if (tenantScoped) return {};
    throw new Error(
      `${requestType} requires a "filter" that scopes the rows, for example { org_id: { _user: organization.id } }. Set "filter: {}" to run on every document in the collection.`
    );
  }
  if (!type.isObject(filter)) {
    throw new Error(
      `${requestType} "filter" should be an object. Received ${JSON.stringify(filter)}.`
    );
  }
  const scopePath = getFilterScope({ filter }).paths.find((path) => pathsOverlap(path, '_enrich'));
  if (scopePath !== undefined) {
    throw new ConfigError(
      `${requestType} "filter" matches "${scopePath}", but enrichment runs write "_enrich", so a run could move rows out of scope. Scope the rows by other fields.`
    );
  }
  return filter;
}

export default getEnrichmentFilter;
