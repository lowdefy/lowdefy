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

// Experimental builds are published as 0.0.0-experimental-<timestamp>, which
// semver ranks below every release, though they are usually ahead of them. So
// a prerelease is only compared with versions of its own major; across majors
// neither version counts as newer.
function isNewerVersion({ candidate, held }) {
  const bothReleases = semver.prerelease(candidate) === null && semver.prerelease(held) === null;
  if (!bothReleases && semver.major(candidate) !== semver.major(held)) {
    return false;
  }
  return semver.gt(candidate, held);
}

export default isNewerVersion;
