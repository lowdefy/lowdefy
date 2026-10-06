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
import resolveBuildDirectory from '../resolveBuildDirectory.js';

function describeEmpty() {
  if (process.env.LOWDEFY_DEV_RECORD === 'false') {
    return 'No recorded dev sessions: recording is off (LOWDEFY_DEV_RECORD=false).';
  }
  return 'No recorded dev sessions in this window.';
}

// `lowdefy journeys session [<id>]`: the dev sessions the dev server recorded,
// newest first, or one session as a log a coding agent writes journeys from -
// one line per interaction with what the app did in response.
async function journeysSession({ context, params = [] }) {
  const { options } = context;
  const [id] = params;
  const since = type.isNone(options.since)
    ? undefined
    : parseSince({ since: options.since, now: Date.now() });
  const records = readRecordings({
    configDirectory: context.directories.config,
    source: 'dev',
    since: type.isUndefined(since) ? undefined : new Date(since),
  }).filter((record) => type.isUndefined(since) || Date.parse(record?.t) >= since);
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
    formatSessionReport({ report, empty: describeEmpty() }).forEach((line) =>
      context.logger.info(line)
    );
  }
  await context.sendTelemetry();
  return report;
}

export default journeysSession;
