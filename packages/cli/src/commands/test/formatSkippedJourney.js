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

// The line for a `deprecated: true` journey a run skipped, with its recent
// use: `SKIP deprecated  member assigns a ticket  0.4/day (3m)`.
function formatSkippedJourney({ skipped }) {
  return `SKIP deprecated  ${skipped.name}  ${skipped.rate.toFixed(1)}/day (${
    skipped.usageWindow
  })`;
}

export default formatSkippedJourney;
