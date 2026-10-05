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

import newestMonth from './newestMonth.js';
import parseUsageWindow from './parseUsageWindow.js';
import sequenceId from '../evidence/sequenceId.js';
import TIERS from './tiers.js';
import usageWindowMonths from './usageWindowMonths.js';
import windowUsage from './windowUsage.js';

const MIN_MATCHES = 100;

function compareRows(a, b) {
  return b.rate - a.rate || a.file.localeCompare(b.file) || a.name.localeCompare(b.name);
}

// A journey has no counts for the flow its steps walk now when it was never
// refreshed (or holds the legacy window shape), or its steps changed what is
// matched since the last refresh. Comparing ids is static, so it costs a hash.
// The stored id reads click text by the config text rule; when the id read
// with every click text equals it, the steps match what they matched at the
// refresh, so only a journey whose ids differ needs isConfigText to tell an
// edit from text that is not config text (readTierConfigText reads it then).
function isUnranked({ journey, isConfigText }) {
  const stored = journey.evidence?.production?.sequence;
  if (type.isUndefined(stored)) return true;
  if (sequenceId({ pageId: journey.pageId, steps: journey.steps }) === stored) return false;
  return sequenceId({ pageId: journey.pageId, steps: journey.steps, isConfigText }) !== stored;
}

// How many journeys, from the top, tier pX holds: the shortest prefix whose
// cumulative rate reaches X% of the total, with journeys tied with the last
// one at the cut included, so a tie is never split across a boundary.
function cutLength({ rows, percent, total }) {
  if (percent === 0) return rows.length;
  let cumulative = 0;
  let length = rows.length;
  for (let index = 0; index < rows.length; index += 1) {
    cumulative += rows[index].rate;
    if (cumulative * 100 >= percent * total - 1e-9) {
      length = index + 1;
      break;
    }
  }
  while (length < rows.length && rows[length].rate === rows[length - 1].rate) {
    length += 1;
  }
  return length;
}

function refusal({ ranked, matches, windowMonths }) {
  const hasEvidence = ranked.some((row) => row.days > 0);
  if (!hasEvidence) {
    return 'No selected journey has production evidence to rank by. Pull production use with "lowdefy journeys pull posthog", then run "lowdefy journeys evidence --refresh".';
  }
  if (matches < MIN_MATCHES) {
    return `The selection has ${matches} journey matches in ${windowMonths[0]} to ${
      windowMonths[windowMonths.length - 1]
    }, fewer than the ${MIN_MATCHES} tiers need. Use --tier full, or pull more production use.`;
  }
  return undefined;
}

// The popularity tiers of a selection of journeys, the one ranking both
// `lowdefy journeys usage` and `lowdefy test --tier` read.
//
// A journey's rate is its sessions over the final days its months hold inside
// the usage window: the last N calendar months ending at the newest month any
// selected journey holds, so every journey is ranked on one calendar. Ranked
// journeys are sorted by rate (ties by file, then name), and tier pX (common
// p50, wide p80, edge p95) is the shortest prefix reaching X% of the summed
// rates; `full` is every journey. Every match counts: a session that backs
// several journeys counts for each, so a tier's share is a share of journey
// matches, not of sessions.
//
// - journeys: [{ file, journeyIndex, name, journey }], one per journey.
// - usageWindow: the `--usage-window` value (`<n>m`, default 3m).
// - isConfigText: the app's config text rule, from readTierConfigText.
//
// Returns { windowMonths, anchor, matches, refused, rows }. A row is
// { file, journeyIndex, name, tier, rank, rate, sessions, failures, days, unranked,
// deprecated }. An unranked journey (no counts for its current flow) is in
// every tier, outside the ranking and the total, with tier `common` and no
// rank or rate. A `deprecated: true` journey is in no tier: tier and rank are
// null, its usage is still shown. `refused` says why tiers other than `full`
// cannot be cut: fewer than 100 matches, or no evidence at all.
function computeTiers({ journeys, usageWindow, isConfigText }) {
  // Deprecated journeys anchor the window too, so one named on its own still
  // shows its recent use.
  const anchor = newestMonth({ journeys: journeys.map(({ journey }) => journey) });
  const windowMonths = usageWindowMonths({ anchor, months: parseUsageWindow(usageWindow) });

  const rows = journeys.map(({ file, journeyIndex, name, journey }) => {
    const deprecated = journey.deprecated === true;
    const unranked = !deprecated && isUnranked({ journey, isConfigText });
    const row = { file, journeyIndex, name, tier: null, rank: null, unranked, deprecated };
    if (unranked) {
      return { ...row, tier: 'common', rate: null, sessions: null, failures: null, days: null };
    }
    const usage = windowUsage({ months: journey.evidence?.production?.months, windowMonths });
    return { ...row, ...usage };
  });

  const ranked = rows.filter((row) => !row.unranked && !row.deprecated).sort(compareRows);
  const total = ranked.reduce((sum, row) => sum + row.rate, 0);
  const matches = ranked.reduce((sum, row) => sum + row.sessions, 0);
  const cuts = TIERS.map((tier) => ({
    name: tier.name,
    length: cutLength({ rows: ranked, percent: tier.percent, total }),
  }));
  ranked.forEach((row, index) => {
    row.rank = index + 1;
    row.tier = cuts.find((cut) => index < cut.length).name;
  });

  return {
    windowMonths,
    anchor,
    matches,
    refused: refusal({ ranked, matches, windowMonths }),
    rows: [
      ...ranked,
      ...rows.filter((row) => row.unranked),
      ...rows.filter((row) => row.deprecated),
    ],
  };
}

export default computeTiers;
