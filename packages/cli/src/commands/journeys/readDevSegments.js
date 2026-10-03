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

import { compileTrace, readRecordings } from '@lowdefy/node-utils';

import loadBlockMetas from './loadBlockMetas.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';

// The dev server keeps recordings for 7 days, so evidence reads that window.
const DEV_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// The dev segments of the last 7 days, compiled the way `journeys compile
// --source dev` compiles them, for `evidence.dev`. Null when this machine
// holds no dev recordings in the window: the source is absent, so evidence
// keeps the committed value.
function readDevSegments({ context, now }) {
  const since = now - DEV_WINDOW_MS;
  const records = readRecordings({
    configDirectory: context.directories.config,
    source: 'dev',
    since: new Date(since),
  }).filter((record) => Date.parse(record?.t) >= since);
  if (records.length === 0) {
    return null;
  }
  const { segments } = compileTrace({
    records,
    blockMetas: loadBlockMetas({ buildDirectory: resolveBuildDirectory({ context }) }),
    source: 'dev',
    filters: { since },
  });
  return { segments };
}

export default readDevSegments;
