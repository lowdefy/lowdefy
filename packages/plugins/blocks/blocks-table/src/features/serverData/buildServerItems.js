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

function getGroupItem({ entry, groupPath, depth, columnKey, collapsed, loading, cache }) {
  const cached = cache.get(entry);
  if (cached?.collapsed === collapsed && cached.depth === depth && cached.loading === loading) {
    return cached;
  }
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
    loading,
    groupPath: path,
  };
  cache.set(entry, item);
  return item;
}

// The display list of a server view: the root list's rows, or its groups with each expanded
// group followed by its own list (groups of the next level, or leaf rows), depth first. Rows not
// loaded yet are `undefined` holes (skeleton rows); a child list whose size is not known yet
// shows one row, or as many as the group's count when it holds leaf rows. A block that failed is
// one inline error row (`kind: 'error'`, with its list and block index for Retry) in place of its
// rows. Group items have the client grouping's shape (flattenGroups: `kind: 'group'`, key,
// depth, columnKey, value, empty, count, aggregates, collapsed) and render with its group row,
// plus `groupPath`, the group values that name the group's own list; they have no leaf range
// (`start`, `end`), since the rows are on the server. Server groups start collapsed. `segments`
// records which list rows each run of items shows, which is how a visible range maps to the
// blocks to load. An expanded group whose own list has no answer yet is `loading` (a spinner in
// its chevron).
function buildServerItems({ blockCache, groupKeys, expandedGroups, rowsById, getId, itemCache }) {
  const { blockSize } = blockCache;
  const items = [];
  const segments = [];

  function emitError({ listKey, groupPath, index }) {
    items.push({ kind: 'error', key: `${listKey}#${index}`, listKey, groupPath, index });
  }

  // `expected`: the rows a group's leaf list holds (the group's count), before its first block
  // says so.
  function emitList(groupPath, expected) {
    const depth = groupPath.length;
    const listKey = getListKey(groupPath);
    const total = blockCache.getTotal(listKey);
    const isGroupLevel = depth < groupKeys.length;
    let count = total;
    if (count === null) {
      if (blockCache.getBlock(listKey, 0)?.status === 'error') {
        emitError({ listKey, groupPath, index: 0 });
        return;
      }
      if (depth === 0) {
        count = 0;
      } else if (!isGroupLevel && expected > 0) {
        count = expected;
      } else {
        count = 1;
      }
    }
    let segment = null;
    for (let blockStart = 0; blockStart < count; blockStart += blockSize) {
      const block = blockCache.getBlock(listKey, blockStart / blockSize);
      const blockRows = block?.rows;
      const blockEnd = Math.min(count, blockStart + blockSize);
      if (block?.status === 'error') {
        emitError({ listKey, groupPath, index: blockStart / blockSize });
        segment = null;
        continue;
      }
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
          const childKey = getListKey([...groupPath, entry.key]);
          const collapsed = !expandedGroups.has(childKey);
          const item = getGroupItem({
            entry,
            groupPath,
            depth,
            columnKey: groupKeys[depth],
            collapsed,
            loading:
              !collapsed &&
              blockCache.getTotal(childKey) === null &&
              blockCache.getBlock(childKey, 0)?.status !== 'error',
            cache: itemCache,
          });
          items.push(item);
          if (!collapsed) {
            segment = null;
            emitList(item.groupPath, entry.count);
          }
        }
      }
    }
  }

  emitList([]);
  return { items, segments };
}

export default buildServerItems;
