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

import checkPropertyName from './checkPropertyName.js';
import dayBounds from './dayBounds.js';

const EVENTS = [
  '$pageview',
  '$pageleave',
  '$autocapture',
  '$rageclick',
  '$dead_click',
  'lowdefy_event_failed',
];

const LOWDEFY_PROPERTIES = [
  'lowdefy_build_id',
  'lowdefy_page_id',
  'lowdefy_block_id',
  'lowdefy_block_ids',
  'lowdefy_block_type',
  'lowdefy_row',
  'lowdefy_column',
  'lowdefy_option',
  'lowdefy_event_scope',
  'lowdefy_event_name',
  'lowdefy_debounce_ms',
  'lowdefy_action_id',
  'lowdefy_action_type',
  'lowdefy_error_name',
  'lowdefy_config_key',
  'lowdefy_invalid_blocks',
];

// One page of one UTC day's events, keyset-paged on (timestamp, uuid): OFFSET
// answers 400 for personal keys, and the uuid tie-break keeps two events in
// the same millisecond from straddling a page boundary. Every value travels
// in `values`; the chain column is selected only when some interaction on the
// day lacks Lowdefy's own block properties.
function buildDayQuery({
  day,
  after,
  pageSize,
  includeChain,
  environment,
  orgProperty = 'org_id',
  rolesProperty = 'roles',
}) {
  checkPropertyName({ flag: '--org-property', name: orgProperty });
  checkPropertyName({ flag: '--roles-property', name: rolesProperty });
  const { start, end } = dayBounds({ day });
  const columns = [
    'toString(uuid) AS uuid',
    'timestamp',
    'event',
    'properties.$session_id AS session_id',
    'properties.$window_id AS window_id',
    'toString(person_id) AS person_id',
    `person.properties.${orgProperty} AS org_id`,
    `person.properties.${rolesProperty} AS roles`,
    'properties.$pathname AS pathname',
    'properties.$current_url AS current_url',
    'properties.$event_type AS event_type',
    'properties.$el_text AS el_text',
    'properties.environment AS environment',
    ...LOWDEFY_PROPERTIES.map((name) => `properties.${name} AS ${name}`),
  ];
  if (includeChain) columns.push('elements_chain');
  const where = [
    '{filters}',
    `event IN (${EVENTS.map((event) => `'${event}'`).join(', ')})`,
    "timestamp >= toDateTime({day_start}, 'UTC')",
    "timestamp < toDateTime({day_end}, 'UTC')",
    "(timestamp > toDateTime({after_ts}, 'UTC') OR (timestamp = toDateTime({after_ts}, 'UTC') AND toString(uuid) > {after_uuid}))",
  ];
  const values = {
    day_start: start,
    day_end: end,
    // The first page starts at the day's first instant with every uuid after ''.
    after_ts: after?.timestamp ?? start,
    after_uuid: after?.uuid ?? '',
    page_size: pageSize,
  };
  if (!type.isNone(environment)) {
    where.push('properties.environment = {environment}');
    values.environment = environment;
  }
  const query = [
    'SELECT',
    `  ${columns.join(',\n  ')}`,
    'FROM events',
    `WHERE ${where.join('\n  AND ')}`,
    'ORDER BY timestamp, uuid',
    'LIMIT {page_size}',
  ].join('\n');
  return { query, values };
}

export default buildDayQuery;
