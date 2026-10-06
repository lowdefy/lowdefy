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

import { isTraceId, omit, type } from '@lowdefy/helpers';

import appendRecords from '../../lib/server/recording/appendRecords.js';
import getBuildId from '../../lib/docs/getBuildId.js';
import readRecordingCookie from '../../lib/server/recording/readRecordingCookie.js';
import servedBuilds from '../../lib/server/recording/servedBuilds.js';
import { getConfigDirectory } from '../../lib/docs/checkpointPaths.js';

const MAX_RECORDS = 500;

// This route writes to disk, so unlike localDevToolsOnly it does not let a
// request with no Origin through: only the recorder in a same-origin dev tab
// posts here. Agents and curl have no reason to.
function isSameOrigin(c) {
  const origin = c.req.header('origin');
  if (!origin) {
    return false;
  }
  try {
    return new URL(origin).host === c.req.header('host');
  } catch {
    return false;
  }
}

async function readBody(c) {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

function isValidBody(body) {
  return (
    type.isObject(body) &&
    isTraceId(body.session) &&
    type.isArray(body.records) &&
    body.records.length <= MAX_RECORDS &&
    body.records.every((record) => type.isObject(record))
  );
}

// The page names the build of the config it rendered when each interaction
// happened (jitPage.js serves it as `_buildId`). It is kept when this process
// served it, else (missing, unknown, from before a restart) replaced with the
// build served now. The cookie decides source and run, never the page: a
// headless journey run is marked by the dev server's own browser,
// and everything else records as dev.
function stampRecord({ record, currentBuild, cookie }) {
  const rest = omit({ ...record }, ['source', 'run']);
  const build = servedBuilds.has(record.build) ? record.build : currentBuild;
  if (cookie === null) {
    return { ...rest, build, source: 'dev' };
  }
  return { ...rest, build, source: cookie.source, run: cookie.run };
}

// POST /api/dev-recording: the dev recorder (client/Recorder.jsx) posts
// batches of interaction records here. Each keeps the build its page ran on
// (or the build served now) and is appended to the trace file of its tab
// session (dev) or run (journey).
async function devRecordingHandler(c) {
  if (!isSameOrigin(c)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  if (process.env.LOWDEFY_DEV_RECORD === 'false') {
    return c.body(null, 204);
  }
  const cookie = readRecordingCookie(c.req.header('cookie'));
  if (cookie === 'off' || cookie?.record === false) {
    return c.body(null, 204);
  }
  const body = await readBody(c);
  if (!isValidBody(body)) {
    return c.json(
      {
        error: `Expected { session, records } with a trace id session and at most ${MAX_RECORDS} record objects.`,
      },
      400
    );
  }
  if (body.records.length === 0) {
    return c.body(null, 204);
  }
  const currentBuild = getBuildId();
  const records = body.records.map((record) => stampRecord({ record, currentBuild, cookie }));
  appendRecords({
    configDirectory: getConfigDirectory(),
    source: cookie === null ? 'dev' : cookie.source,
    id: cookie === null ? body.session : cookie.run.id,
    records,
  });
  return c.body(null, 204);
}

export default devRecordingHandler;
