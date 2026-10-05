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

import isCountedFlow from '../evidence/isCountedFlow.js';
import windowUsage from './windowUsage.js';

function sum({ months, key }) {
  return (months ?? []).reduce((total, entry) => total + entry[key], 0);
}

// The usage report's rows: each computeTiers row with what the report shows
// beside it, its all-time sessions and failures, its months (with that
// month's persons and orgs, which do not add up across months) and its
// deprecated flows with their use over the window. A deprecated flow hashed
// under an older matcher is no longer counted, and says so.
function buildUsageRows({ tiers, journeys }) {
  const byKey = new Map(journeys.map((entry) => [`${entry.file}#${entry.name}`, entry.journey]));
  return tiers.rows.map((row) => {
    const production = byKey.get(`${row.file}#${row.name}`).evidence?.production;
    const months = production?.months ?? [];
    return {
      ...row,
      allTime: {
        sessions: sum({ months, key: 'sessions' }),
        failures: sum({ months, key: 'failures' }),
      },
      months,
      deprecatedFlows: (production?.deprecated ?? []).map((entry) => {
        const counted = isCountedFlow({ entry });
        const flow = { sequence: entry.sequence, replaced: entry.replaced, counted };
        if (!counted) return flow;
        return {
          ...flow,
          ...windowUsage({ months: entry.months, windowMonths: tiers.windowMonths }),
        };
      }),
    };
  });
}

export default buildUsageRows;
