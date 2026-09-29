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

import getListKey from './getListKey.js';
import toGroupIdentity from '../grouping/toGroupIdentity.js';

function getGroupItem({ entry, groupPath, depth, columnKey, collapsed, cache }) {
  const cached = cache.get(entry);
  if (cached?.collapsed === collapsed && cached.depth === depth) return cached;
  const path = [...groupPath, entry.key];
  const item = {
    kind: 'group',
    key: getListKey(path),
    depth,
    columnKey,
    value: entry.key,
    empty: toGroupIdentity(entry.key) === null,
    count: entry.count,
    aggregates: entry.aggregates ?? {},
    collapsed,
    groupPath: path,
  };
  cache.set(entry, item);
  return item;
}

// The display list of a server view: the root list's rows, or its groups with each expanded
// group followed by its own list (groups of the next level, or leaf rows), depth first. Rows not
// loaded yet are `undefined` holes (skeleton rows); a child list whose size is not known yet
// shows one. Group items have the client grouping's shape (flattenGroups: `kind: 'group'`, key,
// depth, columnKey, value, empty, count, aggregates, collapsed) and render with its group row,
// plus `groupPath`, the group values that name the group's own list; they have no leaf range
// (`start`, `end`), since the rows are on the server. Server groups start collapsed. `segments`
// records which list rows each run of items shows, which is how a visible range maps to the
// blocks to load.
function buildServerItems({ blockCache, groupKeys, expandedGroups, rowsById, getId, itemCache }) {
  const { blockSize } = blockCache;
  const items = [];
  const segments = [];

  function emitList(groupPath) {
    const depth = groupPath.length;
    const listKey = getListKey(groupPath);
    const total = blockCache.getTotal(listKey);
    let count = total;
    if (count === null) count = depth === 0 || blockCache.getError(listKey) ? 0 : 1;
    const isGroupLevel = depth < groupKeys.length;
    let segment = null;
    for (let blockStart = 0; blockStart < count; blockStart += blockSize) {
      const block = blockCache.getBlock(listKey, blockStart / blockSize);
      const blockRows = block?.rows;
      const blockEnd = Math.min(count, blockStart + blockSize);
      for (let i = blockStart; i < blockEnd; i++) {
        if (segment === null) {
          segment = { itemStart: items.length, length: 0, listKey, groupPath, listStart: i };
          segments.push(segment);
        }
        segment.length += 1;
        const entry = blockRows?.[i - blockStart];
        if (entry === undefined) {
          items.push(undefined);
        } else if (!isGroupLevel) {
          items.push(rowsById[getId(entry)]);
        } else {
          const collapsed = !expandedGroups.has(getListKey([...groupPath, entry.key]));
          const item = getGroupItem({
            entry,
            groupPath,
            depth,
            columnKey: groupKeys[depth],
            collapsed,
            cache: itemCache,
          });
          items.push(item);
          if (!collapsed) {
            segment = null;
            emitList(item.groupPath);
          }
        }
      }
    }
  }

  emitList([]);
  return { items, segments };
}

export default buildServerItems;
