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

import mapTregError from '../mapTregError.js';
import tregFetch from '../tregFetch.js';
import schema from './schema.js';

// Searches the catalog by what an endpoint does. Answers treg's search result as it is:
// { query, count, total, results: [{ id, provider, cost, observed, ... }], hints }.
async function TregCatalogSearch({ request, connection, signal }) {
  const response = await tregFetch({
    connection,
    path: '/catalog/search',
    query: { q: request.q, limit: request.limit },
    signal,
  });
  if (response.status !== 200) {
    throw mapTregError({ response, target: 'the catalog search', connection });
  }
  return response.body;
}

TregCatalogSearch.schema = schema;
TregCatalogSearch.meta = {
  checkRead: false,
  checkWrite: false,
};

export default TregCatalogSearch;
