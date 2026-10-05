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

// A record as the compiler may see it: a clicked-text token that is the
// token of a config string sets `target.text` to that string and keeps the
// token; any other token leaves the target without text. No other text from a
// day file reaches a reader.
function resolveRecordText({ record, resolve }) {
  if (!type.isObject(record?.target)) return record;
  const target = { ...record.target };
  delete target.text;
  const resolved = type.isString(target.text_token) ? resolve(target.text_token) : null;
  if (!type.isNone(resolved)) target.text = resolved;
  return { ...record, target };
}

// The pull refuses a window longer than the mining cap, while evidence reads
// longer windows, so a longer gap names a pull the cap accepts and says to
// fill the rest the same way.
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

// The production records of a window, read from the per-day cache that
// `lowdefy journeys pull posthog` writes: days in order, records in file
// order, with each day's manifest. A day is in the cache once its manifest is
// written (the pull writes it last). A missing day is an error naming the
// pull that fills it, never a silent gap. Days pulled before clicked text was
// stored as tokens are removed first, so they read as missing. maxDays caps
// the window for the mining commands. Every token is resolved against the
// app's config text set, so compile, coverage and evidence see config text
// and tokens only; isConfigText comes back with the records for readers that
// match journeys against them.
async function readProductionTrace({ context, since, from, to, now = Date.now(), maxDays }) {
  const { directories, logger } = context;
  const window = parseTraceWindow({ since, from, to, now, maxDays });
  removeUntokenisedTraces({ directories, logger });

  const directory = path.join(directories.traces, 'production');
  const days = listWindowDays(window);
  const missing = days.filter(
    (day) => !fs.existsSync(path.join(directory, `${day}.manifest.json`))
  );
  if (missing.length > 0) {
    const shown = missing.length > 5 ? `${missing.slice(0, 5).join(', ')}, …` : missing.join(', ');
    throw new Error(
      `The production trace cache is missing ${missing.length} day(s) of ${window.from}/${
        window.to
      } (${shown}). ${describeMissingPull({ missing })}`
    );
  }
  const records = [];
  const manifests = [];
  let unparsable = 0;
  days.forEach((day) => {
    manifests.push(
      JSON.parse(fs.readFileSync(path.join(directory, `${day}.manifest.json`), 'utf8'))
    );
    const parsed = parseTraceLines({
      text: fs.readFileSync(path.join(directory, `${day}.jsonl`), 'utf8'),
    });
    records.push(...parsed.records);
    unparsable += parsed.unparsable;
  });
  const { salt } = readTraceSalt({ directories });
  const { texts, isConfigText } = await readConfigText({ context });
  const resolve = createTokenResolver({ salt, texts });
  return {
    records: records.map((record) => resolveRecordText({ record, resolve })),
    unparsable,
    window,
    manifests,
    isConfigText,
  };
}

export default readProductionTrace;
