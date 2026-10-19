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

import { getConfigDirectory } from './checkpointPaths.js';
import readBuildArtifact from './readBuildArtifact.js';

function describeEmpty() {
  if (process.env.LOWDEFY_DEV_RECORD === 'false') {
    return 'No recorded dev sessions: recording is off (LOWDEFY_DEV_RECORD=false).';
  }
  return 'No recorded dev sessions in this window.';
}

// What lowdefy_journey_session answers, as `lowdefy journeys session` prints
// it: without an id, the dev sessions this app recorded, newest first; with
// one, that session's log. Returns { text } or { error }.
function readJourneySession({ id, since, now = Date.now() }) {
  const start = type.isNone(since) ? undefined : parseSince({ since, now });
  const records = readRecordings({
    configDirectory: getConfigDirectory(),
    source: 'dev',
    since: type.isUndefined(start) ? undefined : new Date(start),
  }).filter((record) => type.isUndefined(start) || Date.parse(record?.t) >= start);
  const report = buildSessionReport({
    records,
    id,
    blockMetas: readBuildArtifact({ name: 'plugins/blockMetas.json' }) ?? {},
  });
  if (!type.isUndefined(report.error)) {
    return { error: report.error };
  }
  return { text: formatSessionReport({ report, empty: describeEmpty() }).join('\n') };
}

export default readJourneySession;
