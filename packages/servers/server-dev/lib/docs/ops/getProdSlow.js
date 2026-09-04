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

import createResolveEventSource from './createResolveEventSource.js';
import resolveOpsSince from './resolveOpsSince.js';
import runOpsTool from './runOpsTool.js';

const GROUP_FIELDS = [
  'event',
  'endpoint_id',
  'step_id',
  'request_id',
  'page_id',
  'config_key',
  'git_sha',
];

// The percentile leads the metric list because renderApl orders a grouped
// query by its first metric: "slow" means the tail, not the busiest.
async function getProdSlow({
  origin,
  endpoint_id: endpointId,
  page_id: pageId,
  percentile = 95,
  since = 'deploy',
  limit = 20,
}) {
  if (!type.isNumber(percentile) || percentile <= 0 || percentile >= 100) {
    throw new Error(
      `lowdefy_prod_slow percentile must be a number between 0 and 100. Received ${JSON.stringify(
        percentile
      )}.`
    );
  }
  return runOpsTool({
    origin,
    tool: 'lowdefy_prod_slow',
    params: { endpoint_id: endpointId, page_id: pageId, percentile, since, limit },
    run: async ({ adapter }) => {
      const window = await resolveOpsSince({ adapter, since });
      const where = [['duration_ms', 'gte', 0]];
      if (!type.isNone(endpointId)) {
        where.push(['endpoint_id', 'eq', endpointId]);
      }
      if (!type.isNone(pageId)) {
        where.push(['page_id', 'eq', pageId]);
      }
      const metric = `p${percentile}:duration_ms`;
      const groups = await adapter.aggregate({
        where,
        since: window.since,
        group_by: GROUP_FIELDS,
        metrics: [metric, 'count'],
        limit,
      });
      const alias = `p${percentile}_duration_ms`;
      const resolveEventSource = createResolveEventSource();
      return {
        since: window.since,
        git_sha: window.git_sha,
        percentile,
        note: window.note ?? null,
        groups: groups.map((group) => ({
          event: group.event ?? null,
          endpoint_id: group.endpoint_id ?? null,
          step_id: group.step_id ?? null,
          request_id: group.request_id ?? null,
          page_id: group.page_id ?? null,
          [alias]: group[alias] ?? null,
          count: group.count,
          ...resolveEventSource({ configKey: group.config_key, gitSha: group.git_sha }),
        })),
      };
    },
  });
}

export default getProdSlow;
