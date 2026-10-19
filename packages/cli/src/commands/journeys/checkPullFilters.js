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

import MINING_WINDOW_MAX_DAYS from './miningWindowMaxDays.js';
import listWindowDays from './listWindowDays.js';

// The filters a day was pulled with, as its manifest records them.
function pullFilters({ manifest }) {
  return {
    project: manifest.project_id ?? null,
    environment: manifest.environment ?? null,
    testAccounts: manifest.filter_test_accounts === false ? 'included' : 'filtered out',
  };
}

function describeFilters({ project, environment, testAccounts }) {
  const shownEnvironment =
    environment === null ? 'any environment' : `environment "${environment}"`;
  return `project ${project}, ${shownEnvironment}, test accounts ${testAccounts}`;
}

function describeDays({ days }) {
  if (days.length <= 3) return days.join(', ');
  return `${days.slice(0, 3).join(', ')} and ${days.length - 3} more`;
}

function describeRefetch({ from, to }) {
  const span = listWindowDays({ from, to });
  const command = `lowdefy journeys pull posthog --refetch --from ${from} --to ${
    span.length <= MINING_WINDOW_MAX_DAYS ? to : span[MINING_WINDOW_MAX_DAYS - 1]
  }`;
  const rest =
    span.length <= MINING_WINDOW_MAX_DAYS
      ? ''
      : `, then the rest of ${from}/${to} the same way, at most ${MINING_WINDOW_MAX_DAYS} days at a time`;
  return `Pull them again with one set of filters (the same --environment and --include-test-accounts for every day): run "${command}"${rest}.`;
}

// Refuses to combine production days pulled with different filters: another
// PostHog project, another environment, or test accounts included on some
// days and not others count different people, so their sums mean nothing.
// `entries` is [{ day, manifest }], oldest first. Names each set of filters
// with its days, and the pull that makes them one set.
function checkPullFilters({ entries }) {
  const groups = new Map();
  entries.forEach(({ day, manifest }) => {
    const filters = pullFilters({ manifest });
    const key = JSON.stringify(filters);
    if (!groups.has(key)) groups.set(key, { filters, days: [] });
    groups.get(key).days.push(day);
  });
  if (groups.size <= 1) return;
  const described = [...groups.values()]
    .map(({ filters, days }) => `${describeDays({ days })} (${describeFilters(filters)})`)
    .join('; ');
  throw new Error(
    `The production trace cache holds days pulled with different filters, which cannot be counted together: ${described}. ${describeRefetch(
      { from: entries[0].day, to: entries[entries.length - 1].day }
    )}`
  );
}

export default checkPullFilters;
