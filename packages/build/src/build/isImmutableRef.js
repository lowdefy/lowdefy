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

// An immutable ref resolves to the same tree forever, so its module cache
// directory never needs to be refetched.
function isImmutableRef(ref) {
  // Full or abbreviated commit SHAs
  if (/^[0-9a-f]{7,40}$/.test(ref)) return true;
  // Semver-like tags: v1.0.0, v1, 1.2.3, v1.0.0-beta.1, etc.
  if (/^v?\d+(\.\d+)*(-[\w.]+)?$/.test(ref)) return true;
  return false;
}

export default isImmutableRef;
