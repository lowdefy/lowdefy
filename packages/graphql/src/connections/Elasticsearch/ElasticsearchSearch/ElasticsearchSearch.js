/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { Client } from '@elastic/elasticsearch';
import { get } from '@lowdefy/helpers';
import schema from './ElasticsearchSearch.json';

async function elasticsearchSearch({ request, connection }) {
  const client = new Client(connection);

  // Wrap the query in a query property, if necessary
  const body = 'query' in request.query ? request.query : { query: request.query };

  if (request.aggs) {
    body.aggs = { ...(body.aggs || {}), ...request.aggs };
  }

  // Extract all parameters except "query"
  const params = Object.entries(request)
    .filter(([key]) => !['query', 'aggs'].includes(key))
    .reduce(
      (params, [key, value]) => ({
        ...params,
        [key]: value,
      }),
      {}
    );

  const response = await client.search({
    ...params,
    index: request.index || connection.index,
    body,
  });

  // Use the actual documents from the response as the base return value, then
  // augment it with the additional, potentially interesting props.
  const hits = get(response, 'body.hits.hits', { default: [] });

  // Map the documents to a more useful representation in our context: We
  // merge the document ID, the source fields, and the document metadata into
  // a single object. This means the following hit:
  //      {
  //          _id: 42,
  //          _index: 'foo',
  //          _score: 1,
  //          _source: { name: 'bar' }
  //      }
  // will look like this:
  //      {
  //          id: 42,
  //          name: 'bar',
  //          _id: 42,
  //          _index: 'foo',
  //          _score: 1,
  //          _source: { name: 'bar' }
  //      }
  // ...so the user won't need to access properties too deeply nested in
  // their code.
  // Note that the order of merging has been carefully chosen so document
  // properties will always override the source, and any source "id" prop will
  // always override the document ID.
  const items = hits.map((hit) => ({
    id: hit._id,
    ...get(hit, '_source', { default: {} }),
    ...hit,
  }));

  // Set the original response body on the items, so users may retrieve more
  // specific information - this will only be useful in edge cases, but
  // annoying if missing.
  items.response = response.body;

  const total = get(response, 'body.hits.total', { default: {} });

  // Set the total number of results for convenience. If Elasticsearch
  // indicates it has more than 10k results, set the counter to Infinity to
  // indicate that. As the response body is set on the collection, users may
  // access the real total object if they need more details.
  items.total = total.relation === 'gte' && total.value === 10_000 ? Infinity : total.value || 0;

  items.maxScore = get(response, 'body.hits.max_score', { default: 0 });
  items.aggregations = get(response, 'body.aggregations', { default: {} });

  return items;
}

export default { resolver: elasticsearchSearch, schema, checkRead: false, checkWrite: false };
