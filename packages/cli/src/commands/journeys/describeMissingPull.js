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

import listWindowDays from './listWindowDays.js';
import MINING_WINDOW_MAX_DAYS from './miningWindowMaxDays.js';

// The pull that fetches the days `missing` names again, oldest to newest. The
// pull refuses a window longer than the mining cap, so a span longer than the
// cap names a pull the cap accepts and says to fill the rest the same way.
function describeMissingPull({ missing }) {
  const from = missing[0];
  const to = missing[missing.length - 1];
  const span = listWindowDays({ from, to });
  if (span.length <= MINING_WINDOW_MAX_DAYS) {
    return `Run "lowdefy journeys pull posthog --from ${from} --to ${to}" first.`;
  }
  return `Run "lowdefy journeys pull posthog --from ${from} --to ${
    span[MINING_WINDOW_MAX_DAYS - 1]
  }" first, then pull the rest of ${from}/${to} the same way, at most ${MINING_WINDOW_MAX_DAYS} days at a time.`;
}

export default describeMissingPull;
