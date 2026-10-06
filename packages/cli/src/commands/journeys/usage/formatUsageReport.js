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

function formatRate(rate) {
  return `${rate.toFixed(1)}/day`;
}

function describeWindow({ windowMonths }) {
  if (windowMonths.length === 0) return 'no months';
  return `${windowMonths[0]} to ${windowMonths[windowMonths.length - 1]}`;
}

function headline({ row }) {
  if (row.deprecated) return `deprecated  ${formatRate(row.rate)}`;
  if (row.unranked) return 'unranked';
  return `#${row.rank} ${row.tier}  ${formatRate(row.rate)}`;
}

function journeyLines({ row }) {
  const lines = [`${headline({ row })}  ${row.name}  (${row.file})`];
  if (row.unranked) {
    lines.push(
      '    no counts for its current flow yet: run "lowdefy journeys evidence --refresh"; it runs in every tier'
    );
  } else {
    lines.push(
      `    ${row.sessions} sessions, ${row.failures} failed over the window · all time ${row.allTime.sessions} sessions, ${row.allTime.failures} failed`
    );
  }
  if (row.months.length > 0) {
    lines.push(
      `    ${row.months
        .map(
          (entry) =>
            `${entry.month}: ${entry.sessions} (${entry.persons} persons, ${entry.orgs} orgs)`
        )
        .join(' · ')}`
    );
  }
  row.deprecatedFlows.forEach((flow) => {
    const use = flow.counted
      ? `${formatRate(flow.rate)} · ${flow.sessions} sessions over the window`
      : 'no longer counted: hashed under an older matcher';
    lines.push(`    old flow ${flow.sequence}, replaced ${flow.replaced}: ${use}`);
  });
  return lines;
}

function uncoveredLines({ coverage }) {
  if (type.isNone(coverage)) {
    return [
      'Uncovered production flows: no coverage report yet. Run "lowdefy journeys coverage" to list them.',
    ];
  }
  const flows = coverage.flows;
  const lines = [
    `Uncovered production flows in ${coverage.window.from} to ${coverage.window.to} (coverage's window, by sessions, not tiered): ${flows.length}`,
  ];
  flows.forEach((flow) => {
    lines.push(
      `  ${String(flow.count).padStart(6)} sessions  ${flow.page}  ${flow.hash ?? flow.key}  (${
        flow.sequence?.length ?? 0
      } steps)`
    );
  });
  return lines;
}

// The text of `lowdefy journeys usage`: the window and its journey matches,
// the journeys ranked by rate with their tiers, months and old flows, then the
// production flows no journey covers, from the coverage report.
function formatUsageReport({ tiers, rows, coverage, tier }) {
  const lines = [
    `Journey usage over ${describeWindow(tiers)}: ${tiers.matches} journey matches across ${
      tiers.rows.length
    } journeys.`,
    'Tier shares are shares of journey matches, not sessions: a session counts once for every journey it backs.',
  ];
  if (tier !== 'full') {
    lines.push(`Showing tier ${tier}: ${rows.length} journeys.`);
  }
  lines.push('');
  rows.forEach((row) => lines.push(...journeyLines({ row })));
  lines.push('', ...uncoveredLines({ coverage }));
  return lines;
}

export default formatUsageReport;
