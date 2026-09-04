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
import getEventField from './getEventField.js';
import resolveOpsSince from './resolveOpsSince.js';
import runOpsTool from './runOpsTool.js';

// The four groupings an agent asks for, each a field on the wide event. `org`
// only carries a value when the app sets logger.events.identity — without it
// the sink holds no tenant value at all, which is the intended default.
const GROUP_FIELDS = {
  source: 'config_key',
  org: 'user.org',
  page: 'page_id',
  endpoint: 'endpoint_id',
};

const SAMPLE_LIMIT = 200;

function sampleKey({ groupValue, errorName }) {
  return `${JSON.stringify(groupValue ?? null)}|${JSON.stringify(errorName ?? null)}`;
}

async function getProdErrors({
  origin,
  since = 'deploy',
  group_by: groupBy = 'source',
  limit = 20,
}) {
  return runOpsTool({
    origin,
    tool: 'lowdefy_prod_errors',
    params: { since, group_by: groupBy, limit },
    run: async ({ adapter }) => {
      const groupField = GROUP_FIELDS[groupBy];
      if (type.isNone(groupField)) {
        throw new Error(
          `lowdefy_prod_errors group_by must be one of ${Object.keys(GROUP_FIELDS).join(
            ', '
          )}. Received ${JSON.stringify(groupBy)}.`
        );
      }
      const window = await resolveOpsSince({ adapter, since });
      const where = [['success', 'eq', false]];
      const [groups, samples] = await Promise.all([
        adapter.aggregate({
          where,
          since: window.since,
          group_by: [groupField, 'error.name'],
          metrics: ['count'],
          limit,
        }),
        // One extra pass over the recent failures so every group carries a
        // real row: an aggregation returns counts, and the agent's next move
        // needs a rid to trace and a config_key to resolve to a file.
        adapter.query({ where, since: window.since, order: 'desc', limit: SAMPLE_LIMIT }),
      ]);

      const sampleByGroup = samples.reduce((index, row) => {
        const key = sampleKey({
          groupValue: getEventField(row, groupField),
          errorName: getEventField(row, 'error.name'),
        });
        if (!index.has(key)) {
          index.set(key, row);
        }
        return index;
      }, new Map());

      const resolveEventSource = createResolveEventSource();
      const rows = groups.map((group) => {
        const groupValue = group[groupField] ?? null;
        const errorName = group['error.name'] ?? null;
        const sample = sampleByGroup.get(sampleKey({ groupValue, errorName })) ?? null;
        const configKey =
          groupField === 'config_key' ? groupValue : getEventField(sample, 'config_key');
        return {
          [groupBy]: groupValue,
          count: group.count,
          error_name: errorName,
          error_message: getEventField(sample, 'error.message'),
          error_hint: getEventField(sample, 'error.hint'),
          ...resolveEventSource({ configKey, gitSha: getEventField(sample, 'git_sha') }),
          sample_rid: getEventField(sample, 'rid'),
          page_id: getEventField(sample, 'page_id'),
          block_id: getEventField(sample, 'block_id'),
          request_id: getEventField(sample, 'request_id'),
          endpoint_id: getEventField(sample, 'endpoint_id'),
          step_id: getEventField(sample, 'step_id'),
        };
      });

      return {
        group_by: groupBy,
        since: window.since,
        git_sha: window.git_sha,
        note: window.note ?? null,
        groups: rows,
      };
    },
  });
}

export default getProdErrors;
