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

import entrySeverity from './entrySeverity.js';

// The entry the bar speaks for: the newest one at the highest severity
// present. The colour is chosen from the same entry, so the message, the
// "fails in prod" badge and the colour always describe one entry — showing the
// newest entry beside a colour chosen from a worse one told the developer
// "something here is worse" and then pointed at the harmless entry.
function selectBarEntry(errors) {
  let selected = null;
  let selectedSeverity = -1;
  errors.forEach((entry) => {
    const severity = entrySeverity(entry);
    if (severity >= selectedSeverity) {
      selected = entry;
      selectedSeverity = severity;
    }
  });
  return selected;
}

export default selectBarEntry;
