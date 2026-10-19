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

// A flow's months after a refresh. Each month the cache counted replaces the
// committed entry only when the cache read more final days of it: a fuller
// pull wins, and a pruned, partial or equally full cache changes nothing, so
// two machines holding the same days never overwrite each other's counts. A
// recount (the matcher changed, reconcileFlows) also replaces a month read
// from as many days, since the committed count was made the old way. A month
// is never added to itself. Months the cache did not count keep their
// committed values. Oldest first.
function mergeMonths({ committed, counted, recount = false }) {
  const byMonth = new Map(committed.map((entry) => [entry.month, entry]));
  counted.forEach((entry) => {
    const kept = byMonth.get(entry.month);
    if (type.isUndefined(kept) || entry.days > kept.days || (recount && entry.days === kept.days)) {
      byMonth.set(entry.month, entry);
    }
  });
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export default mergeMonths;
