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

import { serializer } from '@lowdefy/helpers';

import scanJitMaps from './scanJitMaps.js';

function pickEntries({ map, ids }) {
  const entries = {};
  for (const id of ids) {
    entries[id] = map[id];
  }
  return entries;
}

// Writes the key and ref entries added since `since` (a mark taken when the
// page build started) to a new file under jitMaps/, so the dev server's error
// handler and tools resolve JIT keys from disk without rewriting the config
// build's keyMap.json and refMap.json on every page build.
//
// Pages build concurrently on one context, so the entries added while this
// build ran can include another build's. That build writes them again when it
// ends, after it has finished filling in its ref entries (a ref's path is set
// after an await), and readers apply files in write order, so the later, more
// complete entry wins. Each write is a new file, so no two builds write the
// same file and no entry is lost.
async function writeJitMaps({ context, since }) {
  const mark = scanJitMaps({ context });
  const keyIds = context.jitMaps.keys.added.slice(since.keys, mark.keys);
  const refIds = context.jitMaps.refs.added.slice(since.refs, mark.refs);
  if (keyIds.length === 0 && refIds.length === 0) {
    return;
  }
  context.jitMaps.writes += 1;
  await context.writeBuildArtifact(
    `jitMaps/${context.jitMaps.name}-${context.jitMaps.writes}.json`,
    serializer.serializeToString({
      keyMap: pickEntries({ map: context.keyMap, ids: keyIds }),
      refMap: pickEntries({ map: context.refMap, ids: refIds }),
    }),
    // The dev server's readers list jitMaps/ while other page builds write to
    // it, so a file must never be seen half-written.
    { atomic: true }
  );
}

export default writeJitMaps;
