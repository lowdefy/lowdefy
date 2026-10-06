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

import buildUsageRows from './usage/buildUsageRows.js';
import committedJourneys from './committedJourneys.js';
import computeTiers from './usage/computeTiers.js';
import formatUsageReport from './usage/formatUsageReport.js';
import inTier from './usage/inTier.js';
import parseTestSelection from '../test/parseTestSelection.js';
import parseTier from './usage/parseTier.js';
import readConfigText from './configText/readConfigText.js';
import readUncoveredFlows from './usage/readUncoveredFlows.js';
import resolveJourneyPaths from '../test/resolveJourneyPaths.js';
import selectTests from '../test/selectTests.js';

function resolvePaths({ context }) {
  const given = context.options.paths ?? [];
  if (given.length === 0) return undefined;
  const resolved = resolveJourneyPaths({
    paths: given,
    base: process.cwd(),
    configDirectory: context.directories.config,
  });
  if (!type.isUndefined(resolved.error)) throw new Error(resolved.error);
  return resolved.files;
}

// `lowdefy journeys usage [paths...] [--tag] [--filter] [--tier]
// [--usage-window] [--json]`: the use-case report. The selected journeys
// ranked by their recent production rate, each with its tier, all-time
// totals, months and old flows, then the production flows no journey covers.
// Tiers are cut over the selection alone, as `lowdefy test --tier` cuts them.
async function journeysUsage({ context }) {
  const { options, logger } = context;
  const tier = parseTier(options.tier);
  const selection = parseTestSelection({ filter: options.filter, tags: options.tag });
  if (!type.isUndefined(selection.error)) throw new Error(selection.error);
  // The selection `lowdefy test` runs, read back to the journeys behind it.
  const selected = selectTests({
    context,
    filter: selection.filters,
    tags: selection.tags,
    paths: resolvePaths({ context }),
  });
  const { journeys: committed, skipped } = committedJourneys({
    context,
    items: selected.map(({ item }) => item),
  });
  skipped.forEach((line) => logger.warn(`Skipped ${line}`));
  const journeys = committed.map(({ file, journeyIndex, journey }) => ({
    file,
    journeyIndex,
    name: journey.name,
    journey,
  }));

  const { isConfigText } = await readConfigText({ context });
  const tiers = computeTiers({ journeys, usageWindow: options.usageWindow, isConfigText });
  if (tier !== 'full' && !type.isUndefined(tiers.refused)) {
    logger.error(tiers.refused);
    process.exitCode = 1;
    await context.sendTelemetry();
    return { ...tiers, rows: [] };
  }
  // Without --tier every journey is listed, deprecated ones included.
  const rows = buildUsageRows({ tiers, journeys }).filter(
    (row) => tier === 'full' || inTier({ row, tier })
  );
  const coverage = readUncoveredFlows({ directories: context.directories });
  const report = {
    windowMonths: tiers.windowMonths,
    anchor: tiers.anchor,
    matches: tiers.matches,
    rows,
    uncovered: coverage,
  };
  if (options.json === true) {
    // The report is the command's output with --json, for agents and skills.
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    formatUsageReport({ tiers, rows, coverage, tier }).forEach((line) => logger.info(line));
  }
  await context.sendTelemetry();
  return report;
}

export default journeysUsage;
