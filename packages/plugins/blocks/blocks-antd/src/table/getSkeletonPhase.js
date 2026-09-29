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

export const SHOW_DELAY_MS = 120;
export const MIN_VISIBLE_MS = 300;

// Skeleton timing (D17): the skeleton shows 120 ms after loading starts, so a fast response never
// flashes it, and once shown it stays at least 300 ms, so it never flickers. `startedAt` is when
// loading started (null when it has not). Phases:
// - `idle`: no skeleton,
// - `hidden`: loading, not yet shown (the skeleton rows hold their space, invisible),
// - `visible`: loading, shown,
// - `holding`: loaded, but shown for less than the minimum; the skeleton stays until `until`.
// `until` is the time the phase ends by itself (null when only `active` can end it).
function getSkeletonPhase({ active, startedAt, now }) {
  if (startedAt === null) return { phase: 'idle', until: null };
  const visibleAt = startedAt + SHOW_DELAY_MS;
  if (active) {
    if (now < visibleAt) return { phase: 'hidden', until: visibleAt };
    return { phase: 'visible', until: null };
  }
  const holdUntil = visibleAt + MIN_VISIBLE_MS;
  if (now < visibleAt || now >= holdUntil) return { phase: 'idle', until: null };
  return { phase: 'holding', until: holdUntil };
}

export default getSkeletonPhase;
