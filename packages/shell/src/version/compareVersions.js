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

function parseVersion(version) {
  const [major = 0, minor = 0, patch = 0] = String(version)
    .split('-')[0]
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  return [major, minor, patch];
}

// Compares two release versions ("7.4.0") by major, minor and patch: below 0 when a is older than
// b, 0 when they match, above 0 when a is newer. A prerelease suffix is ignored.
function compareVersions(a, b) {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    if (partsA[i] !== partsB[i]) {
      return partsA[i] - partsB[i];
    }
  }
  return 0;
}

export default compareVersions;
