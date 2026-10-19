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

import path from 'path';
import { type } from '@lowdefy/helpers';

import committedJourneys from '../journeys/committedJourneys.js';
import computeTiers from '../journeys/usage/computeTiers.js';
import inTier from '../journeys/usage/inTier.js';
import loadRouteTable from '../journeys/loadRouteTable.js';
import readTierConfigText from '../journeys/usage/readTierConfigText.js';
import resolveBuildDirectory from '../journeys/resolveBuildDirectory.js';

function journeyKey({ file, journeyIndex }) {
  return `${file}#${journeyIndex}`;
}

// What a PASS line shows of a journey's place in the ranking. Undefined for a
// journey with no production evidence: there is nothing to rank it by. Below
// the match floor there is no ranking, so tier and rank are null and the line
// shows the rate and failures only.
function describeUsage({ row, journey, usageWindow, ranked }) {
  if (type.isNone(journey.evidence?.production)) return undefined;
  return {
    tier: ranked ? row.tier : null,
    rank: ranked ? row.rank : null,
    rate: row.rate,
    failures: row.failures,
    unranked: row.unranked,
    usageWindow,
  };
}

// Narrows the items selectTests picked (paths, tags and filters already
// applied) to a popularity tier of that selection, as `lowdefy test --tier`
// and lowdefy_run_tests' `tier` do. Tiers are cut by computeTiers over the
// distinct journeys of the selection, one per file and place in the file, so
// a journey with a list of users is tiered once and all its persona runs go
// with it. An unranked journey runs in every tier. A `deprecated: true`
// journey never runs, named directly or not; it is returned in `skipped`,
// once per journey. An item the runner will refuse (a file that does not
// parse, a journey that does not validate) stays selected so the run reports
// it.
//
// A full run cuts no tier, so the ranking only decorates its PASS lines: it
// never reads the config text set (which can mean a config build), and a
// journey whose id cannot be confirmed without it shows as unranked.
//
// - tier: common, wide, edge or full (parsed by parseTier).
// - usageWindow: `<n>m` (parsed by parseUsageWindow).
// - fullTierOption: how the caller asks for a full run, named when a tier is
//   refused: `--tier full` for `lowdefy test`, `tier "full"` for the MCP tool.
//
// Returns { selected, skipped, refused, tierRows }: `selected` the
// { suite, item, usage } entries to run, `usage` what the PASS line shows of
// the journey's tier; `skipped` the deprecated journeys as { name, filePath,
// rate, usageWindow }; `refused` why a tier other than full cannot be cut (nothing is
// selected then); `tierRows` the computeTiers rows.
async function selectTier({ context, selected, tier, usageWindow, fullTierOption }) {
  const { journeys: committed } = committedJourneys({
    context,
    items: selected.map(({ item }) => item),
  });
  const journeys = committed.map(({ file, journeyIndex, journey }) => ({
    file,
    journeyIndex,
    name: journey.name,
    journey,
  }));
  const routeTable = loadRouteTable({ buildDirectory: resolveBuildDirectory({ context }) });
  let isConfigText;
  if (tier !== 'full') {
    isConfigText = await readTierConfigText({ context, journeys, routeTable });
  }
  const tiers = computeTiers({ journeys, usageWindow, routeTable, isConfigText, fullTierOption });
  const ranked = type.isUndefined(tiers.refused);
  if (tier !== 'full' && !ranked) {
    return { selected: [], skipped: [], refused: tiers.refused, tierRows: tiers.rows };
  }
  const rows = new Map(tiers.rows.map((row) => [journeyKey(row), row]));
  const result = { selected: [], skipped: [], refused: undefined, tierRows: tiers.rows };
  const skippedKeys = new Set();
  selected.forEach((entry) => {
    const { item } = entry;
    const key = journeyKey({
      file: path.relative(context.directories.config, item.filePath),
      journeyIndex: item.journeyIndex,
    });
    const row = rows.get(key);
    if (type.isUndefined(row)) {
      result.selected.push(entry);
      return;
    }
    const usage = describeUsage({
      row,
      journey: item.personaOf ?? item.journey,
      usageWindow,
      ranked,
    });
    if (row.deprecated) {
      if (skippedKeys.has(key)) return;
      skippedKeys.add(key);
      result.skipped.push({ name: row.name, filePath: item.filePath, rate: row.rate, usageWindow });
      return;
    }
    if (inTier({ row, tier })) {
      result.selected.push({ ...entry, usage });
    }
  });
  return result;
}

export default selectTier;
