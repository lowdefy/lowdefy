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

import getBlockRange from './getBlockRange.js';

// The blocks behind display items `rowStart` to `rowEnd` (exclusive). `segments` map runs of
// display items to the list rows they show: `{ itemStart, length, listKey, groupPath,
// listStart }`, in item order.
function getNeededBlocks({ segments, rowStart, rowEnd, blockSize }) {
  const needed = [];
  const seen = new Set();
  segments.forEach((segment) => {
    const segmentEnd = segment.itemStart + segment.length;
    if (segmentEnd <= rowStart || segment.itemStart >= rowEnd) return;
    const from = Math.max(rowStart, segment.itemStart) - segment.itemStart + segment.listStart;
    const to = Math.min(rowEnd, segmentEnd) - segment.itemStart + segment.listStart;
    const { first, last } = getBlockRange({ startRow: from, endRow: to, blockSize });
    for (let index = first; index <= last; index++) {
      const id = `${segment.listKey}#${index}`;
      if (seen.has(id)) continue;
      seen.add(id);
      needed.push({ listKey: segment.listKey, groupPath: segment.groupPath, index });
    }
  });
  return needed;
}

export default getNeededBlocks;
