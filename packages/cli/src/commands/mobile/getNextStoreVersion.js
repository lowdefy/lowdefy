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

import { type } from '@lowdefy/helpers';

function parseVersion(version) {
  return version.split('.').map(Number);
}

// The next patch for each platform's latest build: one past it when the build
// is on the entry's major.minor, else <major>.<minor>.0. The highest wins, so
// both stores ship the same store version.
function getNextPatch({ major, minor, latestVersion }) {
  if (!type.isString(latestVersion)) {
    return 0;
  }
  const [latestMajor, latestMinor, latestPatch = 0] = parseVersion(latestVersion);
  if (latestMajor !== major || latestMinor !== minor || !Number.isInteger(latestPatch)) {
    return 0;
  }
  return latestPatch + 1;
}

function getNextStoreVersion({ entryVersion, latestVersions }) {
  const [major, minor] = parseVersion(entryVersion);
  const patch = Math.max(
    0,
    ...latestVersions.map((latestVersion) => getNextPatch({ major, minor, latestVersion }))
  );
  return `${major}.${minor}.${patch}`;
}

export default getNextStoreVersion;
