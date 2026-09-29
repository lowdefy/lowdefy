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

// Pins a column to `side` ('start' | 'end'), or unpins it (side null). A newly pinned column goes
// to the inner edge of its region: the end of the start region, the start of the end region.
function pinColumn({ pinning, key, side }) {
  const start = pinning.start.filter((entry) => entry !== key);
  const end = pinning.end.filter((entry) => entry !== key);
  if (side === 'start') start.push(key);
  if (side === 'end') end.unshift(key);
  return { start, end };
}

export default pinColumn;
