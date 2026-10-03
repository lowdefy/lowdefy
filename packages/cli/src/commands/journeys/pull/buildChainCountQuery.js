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

import dayBounds from './dayBounds.js';

// One cheap count before a day's pages: how many rows the day holds (checked
// against --max-rows) and how many interactions lack Lowdefy's block
// properties. Only then does the day need the ~3 KB elements_chain per row.
function buildChainCountQuery({ day, environment }) {
  const { start, end } = dayBounds({ day });
  const where = [
    '{filters}',
    "event IN ('$pageview', '$pageleave', '$autocapture', '$rageclick', '$dead_click', 'lowdefy_event_failed')",
    "timestamp >= toDateTime({day_start}, 'UTC')",
    "timestamp < toDateTime({day_end}, 'UTC')",
  ];
  const values = { day_start: start, day_end: end };
  if (!type.isNone(environment)) {
    where.push('properties.environment = {environment}');
    values.environment = environment;
  }
  const query = [
    'SELECT',
    '  count() AS total,',
    "  countIf(event IN ('$autocapture', '$rageclick', '$dead_click') AND isNull(properties.lowdefy_block_id)) AS unenriched",
    'FROM events',
    `WHERE ${where.join('\n  AND ')}`,
  ].join('\n');
  return { query, values };
}

export default buildChainCountQuery;
