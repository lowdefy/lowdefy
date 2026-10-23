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

// How far past the smallest width a drag must go before letting go collapses the panel.
const COLLAPSE_DISTANCE = 64;

// Where a drag that has reached `raw` pixels puts the panel. Short of the smallest width the
// edge resists, moving a quarter of the pointer's distance, until the drag is far enough past
// to collapse the panel on release.
function getDragWidth({ raw, minWidth, maxWidth }) {
  if (raw >= minWidth) return { width: Math.round(Math.min(maxWidth, raw)), collapse: false };
  if (raw < minWidth - COLLAPSE_DISTANCE) return { width: 0, collapse: true };
  return { width: Math.round(minWidth - (minWidth - raw) / 4), collapse: false };
}

export { COLLAPSE_DISTANCE };
export default getDragWidth;
