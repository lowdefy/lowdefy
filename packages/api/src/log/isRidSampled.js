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

// The sampling decision is a pure function of the request id, so every event
// of a kept request is kept and a sampled log holds whole requests instead of
// a scatter of unrelated lines. FNV-1a over the id with an avalanche finalizer
// - request ids are sequential or share a long prefix often enough that the
// unmixed hash would keep or drop them in runs - mapped into [0, 1).
function isRidSampled({ rid, sampleRate }) {
  if (!type.isNumber(sampleRate) || sampleRate <= 0) {
    return false;
  }
  if (sampleRate >= 1) {
    return true;
  }
  if (!type.isString(rid)) {
    return false;
  }
  let hash = 2166136261;
  for (let index = 0; index < rid.length; index += 1) {
    hash ^= rid.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296 < sampleRate;
}

export default isRidSampled;
