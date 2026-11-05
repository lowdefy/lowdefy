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

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNTIME_ENTRIES = ['(garbage collector)', '(program)', '(idle)'];
const BUILD_PACKAGE = '@lowdefy/build';

function addTime(totals, key, ms) {
  totals[key] = (totals[key] ?? 0) + ms;
}

// Where a profile node's self time goes: a runtime entry, node's own modules
// as (node), V8 built-ins with no script as (native), or the npm package of
// the file (packageOf), with @lowdefy/build's time also per source file.
function attribute({ callFrame, packageOf, totals, ms }) {
  if (RUNTIME_ENTRIES.includes(callFrame.functionName)) {
    addTime(totals.runtime, callFrame.functionName, ms);
    return;
  }
  const { url } = callFrame;
  if (url.startsWith('node:')) {
    addTime(totals.packages, '(node)', ms);
    return;
  }
  if (url === '') {
    addTime(totals.packages, '(native)', ms);
    return;
  }
  if (!url.startsWith('file://')) {
    addTime(totals.packages, '(other)', ms);
    return;
  }
  const filePath = fileURLToPath(url);
  const owner = packageOf(filePath);
  if (owner === null) {
    addTime(totals.packages, '(no package)', ms);
    return;
  }
  addTime(totals.packages, owner.name, ms);
  if (owner.name === BUILD_PACKAGE) {
    addTime(totals.buildFiles, path.relative(owner.root, filePath).split(path.sep).join('/'), ms);
  }
}

// Each sample lasts until the next one; the last until the profile's end.
// Times in a .cpuprofile are microseconds.
function addProfile({ packageOf, profile, totals }) {
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const { samples, timeDeltas } = profile;
  const timestamps = [];
  let timestamp = profile.startTime;
  timeDeltas.forEach((delta) => {
    timestamp += delta;
    timestamps.push(timestamp);
  });
  samples.forEach((nodeId, index) => {
    const next = index + 1 < samples.length ? timestamps[index + 1] : profile.endTime;
    const ms = (next - timestamps[index]) / 1000;
    attribute({ callFrame: nodes.get(nodeId).callFrame, packageOf, totals, ms });
  });
  totals.durationMs += (profile.endTime - profile.startTime) / 1000;
}

// Self time of one or more V8 CPU profiles (the config passes of one build),
// summed, in ms: { durationMs, packages, buildFiles, runtime }, each of the
// last three an object from name to ms.
function summarizeCpuProfiles({ packageOf, profiles }) {
  const totals = { durationMs: 0, packages: {}, buildFiles: {}, runtime: {} };
  profiles.forEach((profile) => addProfile({ packageOf, profile, totals }));
  return totals;
}

export default summarizeCpuProfiles;
