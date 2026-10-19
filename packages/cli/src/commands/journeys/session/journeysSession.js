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

import {
  buildSessionReport,
  formatSessionReport,
  parseSince,
  readRecordings,
} from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import loadBlockMetas from '../loadBlockMetas.js';
import MINING_WINDOW_MAX_DAYS from '../miningWindowMaxDays.js';
import readProductionTrace from '../readProductionTrace.js';
import resolveBuildDirectory from '../resolveBuildDirectory.js';

const SOURCES = ['dev', 'production'];

function readDevRecords({ context }) {
  const { options } = context;
  if (!type.isNone(options.from) || !type.isNone(options.to)) {
    throw new Error('--from and --to choose a production window; use --since for dev sessions.');
  }
  const since = type.isNone(options.since)
    ? undefined
    : parseSince({ since: options.since, now: Date.now() });
  const records = readRecordings({
    configDirectory: context.directories.config,
    source: 'dev',
    since: type.isUndefined(since) ? undefined : new Date(since),
  }).filter((record) => type.isUndefined(since) || Date.parse(record?.t) >= since);
  const empty =
    process.env.LOWDEFY_DEV_RECORD === 'false'
      ? 'No recorded dev sessions: recording is off (LOWDEFY_DEV_RECORD=false).'
      : 'No recorded dev sessions in this window.';
  return { records, empty };
}

// Production records of the pulled cache, over whole UTC days of the window,
// each clicked-text token read back as text only when it is config text.
// Typed values are never in production records.
async function readProductionRecords({ context }) {
  const { options } = context;
  const { records, window } = await readProductionTrace({
    context,
    maxDays: MINING_WINDOW_MAX_DAYS,
    since: options.since,
    from: options.from,
    to: options.to,
  });
  return { records, empty: `No production sessions in ${window.from}/${window.to}.` };
}

// `lowdefy journeys session [<id>]`: the sessions recorded in dev (the
// default) or pulled from production, newest first, or one session as a log a
// coding agent writes journeys from - one line per interaction with what the
// app did in response.
async function journeysSession({ context, params = [] }) {
  const { options } = context;
  const [id] = params;
  const source = options.source ?? 'dev';
  if (!SOURCES.includes(source)) {
    throw new Error(`--source should be one of ${SOURCES.join(', ')}. Received "${source}".`);
  }
  const { records, empty } =
    source === 'production'
      ? await readProductionRecords({ context })
      : readDevRecords({ context });
  const report = buildSessionReport({
    records,
    id,
    blockMetas: loadBlockMetas({ buildDirectory: resolveBuildDirectory({ context }) }),
  });
  if (!type.isUndefined(report.error)) {
    throw new Error(report.error);
  }
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    formatSessionReport({ report, empty }).forEach((line) => context.logger.info(line));
  }
  await context.sendTelemetry();
  return report;
}

export default journeysSession;
