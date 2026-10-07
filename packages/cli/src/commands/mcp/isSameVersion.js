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

// Whether two Lowdefy versions are the same release. Semver equality, so a
// leading "v" or build metadata does not count as a difference. A version
// that is not valid semver is compared as written; a missing one is never the
// same as anything, since nothing can be said about it.
function isSameVersion({ a, b }) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const validA = semver.valid(semver.clean(a));
  const validB = semver.valid(semver.clean(b));
  if (validA === null || validB === null) {
    return a.trim() === b.trim();
  }
  return semver.eq(validA, validB);
}

export default isSameVersion;
