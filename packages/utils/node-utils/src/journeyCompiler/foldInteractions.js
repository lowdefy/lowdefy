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

import collapseChangeRuns from './collapseChangeRuns.js';
import collapseRepeatedClicks from './collapseRepeatedClicks.js';
import foldFocusClicks from './foldFocusClicks.js';
import foldOptionToggle from './foldOptionToggle.js';
import foldSelect from './foldSelect.js';

// The only place interactions are removed from a segment; every other
// interaction becomes a step. Applied in this order: keystroke runs collapse
// into one change, option toggles fold into their labelled click, focus clicks
// fold into the fill, popup picks fold into the option click, repeated clicks
// collapse, and pageleave records (ends for coverage, not steps) go.
function foldInteractions({ records }) {
  let folded = collapseChangeRuns({ records });
  folded = foldOptionToggle({ records: folded });
  folded = foldFocusClicks({ records: folded });
  folded = foldSelect({ records: folded });
  folded = collapseRepeatedClicks({ records: folded });
  return folded.filter((record) => record.kind !== 'pageleave');
}

export default foldInteractions;
