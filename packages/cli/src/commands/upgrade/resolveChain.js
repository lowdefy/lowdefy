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

import semver from 'semver';

function resolveChain({ registry, currentVersion, targetVersion }) {
  if (semver.gte(currentVersion, targetVersion)) {
    return [];
  }

  const candidates = (registry.versions ?? [])
    .filter((entry) => semver.valid(entry.version) && semver.lte(entry.version, targetVersion))
    .sort((a, b) => semver.compare(a.version, b.version));

  const chain = [];
  let cursor = currentVersion;

  while (semver.lt(cursor, targetVersion)) {
    const match = candidates.find(
      (entry) => semver.gt(entry.version, cursor) && semver.satisfies(cursor, entry.from)
    );

    if (match) {
      chain.push(match);
      cursor = match.version;
      continue;
    }

    // Gap handling: skip to next entry with version > cursor
    const next = candidates.find((entry) => semver.gt(entry.version, cursor));
    if (next) {
      chain.push(next);
      cursor = next.version;
      continue;
    }

    // No more entries — chain is complete
    break;
  }

  return chain;
}

export default resolveChain;
