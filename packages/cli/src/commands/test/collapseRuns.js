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

// The journeys behind a list of selected items, each once, for the steps that read a journey
// rather than run it: `lowdefy test --lint`, and evidence, coverage, usage and tiers
// (committedJourneys). The runs of a journey (expandJourney) collapse by `expandedFrom`, the
// journey as written. A journey with a `user` list collapses to the journey as written, which is
// a journey readers read, user list and all. A journey with a `cases` table collapses to its
// first selected run, keeping `expandedFrom`: as written it holds `_case` placeholders where
// readers expect values, and every row runs the same steps.
function collapseRuns({ items }) {
  const seen = new Set();
  const collapsed = [];
  items.forEach((item) => {
    if (type.isUndefined(item.expandedFrom)) {
      collapsed.push(item);
      return;
    }
    if (seen.has(item.expandedFrom)) return;
    seen.add(item.expandedFrom);
    if (!type.isUndefined(item.expandedFrom.cases)) {
      collapsed.push(item);
      return;
    }
    collapsed.push({
      filePath: item.filePath,
      journeyIndex: item.journeyIndex,
      journey: item.expandedFrom,
    });
  });
  return collapsed;
}

export default collapseRuns;
