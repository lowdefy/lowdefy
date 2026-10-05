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

import { readRecordings } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import formatSessionLine from './formatSessionLine.js';
import loadRouteTable from './loadRouteTable.js';
import parseSince from './parseSince.js';
import readTestRunKeys from './readTestRunKeys.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';
import resolveCurrentBuild from './resolveCurrentBuild.js';
import summariseSessions from './summariseSessions.js';

async function resolveBuild({ context, records, build }) {
  if (type.isNone(build)) return undefined;
  if (build !== 'current') return build;
  const { buildId, from } = await resolveCurrentBuild({ context, records });
  if (from === 'records' && !type.isNone(buildId)) {
    context.logger.info(
      `No dev server for this app answered, so --build current is the newest build in the recordings, ${buildId}.`
    );
  }
  return buildId;
}

// `lowdefy journeys recordings`: the dev sessions the dev server recorded, so
// the developer and the journeys-from-dev skill can see what was tried, with
// the interactions the newest test run already drove (measured coverage).
async function journeysRecordings({ context }) {
  const { options } = context;
  const configDirectory = context.directories.config;
  const since = type.isNone(options.since)
    ? undefined
    : parseSince({ since: options.since, now: Date.now() });
  const records = readRecordings({
    configDirectory,
    source: 'dev',
    since: type.isUndefined(since) ? undefined : new Date(since),
  }).filter((record) => type.isUndefined(since) || Date.parse(record?.t) >= since);

  const build = await resolveBuild({ context, records, build: options.build });
  const routeTable = loadRouteTable({ buildDirectory: resolveBuildDirectory({ context }) });
  const { testRun, keys } = readTestRunKeys({ configDirectory, routeTable });
  const sessions = summariseSessions({
    records,
    routeTable,
    testKeys: keys,
    hasTestRun: testRun !== null,
  })
    .filter((session) => type.isNone(options.page) || session.pages.includes(options.page))
    .filter((session) => type.isUndefined(build) || session.builds.includes(build));

  const result = { sessions, testRun };
  if (options.json === true) {
    // Data for the journeys-from-dev skill, on stdout so it can be parsed.
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (sessions.length === 0) {
    context.logger.info(
      process.env.LOWDEFY_DEV_RECORD === 'false'
        ? 'No recorded dev sessions: recording is off (LOWDEFY_DEV_RECORD=false).'
        : 'No recorded dev sessions in this window.'
    );
  } else {
    sessions.forEach((session) => context.logger.info(formatSessionLine(session)));
  }
  await context.sendTelemetry();
  return result;
}

export default journeysRecordings;
