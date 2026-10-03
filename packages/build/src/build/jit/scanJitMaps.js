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

function scanIdLog({ map, log }) {
  for (const id of Object.keys(map)) {
    if (!log.seen.has(id)) {
      log.seen.add(id);
      log.added.push(id);
    }
  }
}

// Logs the ids added to the context's key and ref maps since the last scan, and
// returns how many each log holds: a mark that later writes slice from.
function scanJitMaps({ context }) {
  const { jitMaps } = context;
  scanIdLog({ map: context.keyMap, log: jitMaps.keys });
  scanIdLog({ map: context.refMap, log: jitMaps.refs });
  return { keys: jitMaps.keys.added.length, refs: jitMaps.refs.added.length };
}

export default scanJitMaps;
