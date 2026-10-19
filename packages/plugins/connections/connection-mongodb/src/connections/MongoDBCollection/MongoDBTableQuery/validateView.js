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

import parseAggregates from './parseAggregates.js';
import parseCondition from './parseCondition.js';
import parseGroup from './parseGroup.js';
import parseSort from './parseSort.js';

const MAX_SEARCH_LENGTH = 200;

function parseSearch({ search }) {
  if (type.isNone(search)) {
    return null;
  }
  if (!type.isString(search) || search.length > MAX_SEARCH_LENGTH) {
    throw new Error(
      `MongoDBTableQuery view search must be a string of at most ${MAX_SEARCH_LENGTH} characters. Received ${JSON.stringify(
        search
      )}.`
    );
  }
  const trimmed = search.trim();
  return trimmed === '' ? null : trimmed;
}

// The view comes from the browser, so it is validated against the request's `fields`
// allowlist. Only sort, filter, search, group and aggregates are read; the rest of a
// Table view (columns, density, ...) is display state and never reaches the query.
function validateView({ view, fieldsByKey, user, timeZone }) {
  if (type.isNone(view)) {
    return { sort: [], filter: null, search: null, group: [], aggregates: {} };
  }
  if (!type.isObject(view)) {
    throw new Error(`MongoDBTableQuery view is not an object. Received ${JSON.stringify(view)}.`);
  }
  return {
    sort: parseSort({ sort: view.sort, fieldsByKey }),
    filter: type.isNone(view.filter)
      ? null
      : parseCondition({ condition: view.filter, fieldsByKey, user, timeZone }),
    search: parseSearch({ search: view.search }),
    group: parseGroup({ group: view.group, fieldsByKey }),
    aggregates: parseAggregates({ aggregates: view.aggregates, fieldsByKey }),
  };
}

export default validateView;
