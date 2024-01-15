/*
  Copyright 2020-2024 Lowdefy, Inc

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
import schema from './schema.js';

async function ElasticsearchSearch({ request, connection }) {
  const client = new Client(connection);

  const { body: response } = await client.search({
    ...request,
    index: request.index || connection.index,
  });

  const rawHits = get(response, 'hits.hits', { default: [] });

  // Return the actual documents as hits.
  // Map the documents to a more useful representation in our context:
  // We return the results in the _source field as the main results
  // and return all other fields in the _meta field.
  const hits = rawHits.map((hit) => {
    const { _source, ..._meta } = hit;
    return {
      ..._source,
      _meta,
    };
  });

  return {
    response,
    hits,
    total: get(response, 'hits.total', { default: {} }),
    maxScore: get(response, 'hits.max_score', { default: 0 }),
    aggregations: get(response, 'aggregations', { default: {} }),
  };
}

ElasticsearchSearch.schema = schema;
ElasticsearchSearch.meta = {
  checkRead: true,
  checkWrite: false,
};

export default ElasticsearchSearch;
