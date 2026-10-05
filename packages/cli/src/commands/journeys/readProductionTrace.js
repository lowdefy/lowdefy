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

import fs from 'fs';
import path from 'path';
import { parseTraceLines } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import createTokenResolver from './createTokenResolver.js';
import listWindowDays from './listWindowDays.js';
import MINING_WINDOW_MAX_DAYS from './miningWindowMaxDays.js';
import parseTraceWindow from './parseTraceWindow.js';
import readConfigText from './configText/readConfigText.js';
import readTraceSalt from './pull/readTraceSalt.js';
import removeUntokenisedTraces from './removeUntokenisedTraces.js';
import resolveRecordText from './resolveRecordText.js';

// The pull refuses a window longer than the mining cap, so a gap longer than
// the cap names a pull the cap accepts and says to fill the rest the same
// way. Evidence refresh reads months through readProductionMonths, which
// allows gaps, so it never reaches this message.
function describeMissingPull({ missing }) {
  const from = missing[0];
  const to = missing[missing.length - 1];
  const span = listWindowDays({ from, to });
  if (span.length <= MINING_WINDOW_MAX_DAYS) {
    return `Run "lowdefy journeys pull posthog --from ${from} --to ${to}" first.`;
  }
  return `Run "lowdefy journeys pull posthog --from ${from} --to ${
    span[MINING_WINDOW_MAX_DAYS - 1]
  }" first, then pull the rest of ${from}/${to} the same way, at most ${MINING_WINDOW_MAX_DAYS} days at a time.`;
}

function readManifest({ directory, day }) {
  const manifestPath = path.join(directory, `${day}.manifest.json`);
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// A day hashed under another salt resolves none of its tokens, so it reads as
// missing rather than as a window of unresolved clicks. Pulling it again
// hashes it under this machine's salt; with no salt, the pull writes a new one.
function describeOtherSalt({ otherSalt, traceSalt }) {
  if (otherSalt.length === 0) return '';
  if (type.isNone(traceSalt)) {
    return ` There is no trace salt in .lowdefy/traces/production/, so ${otherSalt.length} pulled day(s) cannot be read; pulling them again hashes them under a new salt.`;
  }
  return ` ${otherSalt.length} of them were pulled under another trace salt; pulling them again hashes them under this machine's salt.`;
}

// The production records of a window, read from the per-day cache that
// `lowdefy journeys pull posthog` writes: days in order, records in file
// order, with each day's manifest. A day is in the cache once its manifest is
// written (the pull writes it last) under this machine's salt. A missing day
// is an error naming the pull that fills it, never a silent gap. Days pulled
// before clicked text was stored as tokens are removed first, so they read as
// missing. maxDays caps the window for the mining commands. Every token is
// resolved against the app's config text set, so compile, coverage and
// evidence see config text and tokens only; isConfigText comes back with the
// records for readers that match journeys against them. A reader never writes
// a salt.
async function readProductionTrace({ context, since, from, to, now = Date.now(), maxDays }) {
  const { directories, logger } = context;
  const window = parseTraceWindow({ since, from, to, now, maxDays });
  removeUntokenisedTraces({ directories, logger, now });

  const directory = path.join(directories.traces, 'production');
  const traceSalt = readTraceSalt({ directories });
  const saltId = type.isNone(traceSalt) ? null : traceSalt.saltId;
  const days = listWindowDays(window);
  const manifests = days.map((day) => readManifest({ directory, day }));
  const otherSalt = days.filter(
    (day, index) => !type.isNone(manifests[index]) && manifests[index].salt_id !== saltId
  );
  const missing = days.filter(
    (day, index) => type.isNone(manifests[index]) || otherSalt.includes(day)
  );
  if (missing.length > 0) {
    const shown = missing.length > 5 ? `${missing.slice(0, 5).join(', ')}, …` : missing.join(', ');
    throw new Error(
      `The production trace cache is missing ${missing.length} day(s) of ${window.from}/${
        window.to
      } (${shown}).${describeOtherSalt({ otherSalt, traceSalt })} ${describeMissingPull({
        missing,
      })}`
    );
  }
  const records = [];
  let unparsable = 0;
  days.forEach((day) => {
    const parsed = parseTraceLines({
      text: fs.readFileSync(path.join(directory, `${day}.jsonl`), 'utf8'),
    });
    records.push(...parsed.records);
    unparsable += parsed.unparsable;
  });
  const { texts, isConfigText } = await readConfigText({ context });
  const resolve = createTokenResolver({ salt: traceSalt.salt, texts });
  return {
    records: records.map((record) => resolveRecordText({ record, resolve })),
    unparsable,
    window,
    manifests,
    isConfigText,
  };
}

export default readProductionTrace;
