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

import { useCallback, useMemo, useRef, useState } from 'react';

import getExpandedIds from '../expansion/getExpandedIds.js';

function wrapRow({ item, cache, isExpandable, expandedIds }) {
  const expandable = isExpandable(item.original);
  const detailExpanded = expandable && expandedIds.has(item.id);
  const cached = cache.get(item);
  if (cached?.expandable === expandable && cached.detailExpanded === detailExpanded) return cached;
  const base = item.kind
    ? item
    : { kind: 'row', id: item.id, row: item, original: item.original, index: item.index };
  const wrapped = { ...base, expandable, detailExpanded };
  cache.set(item, wrapped);
  return wrapped;
}

function getDetail({ item, cache }) {
  let detail = cache.get(item.row);
  if (detail?.original !== item.original) {
    detail = {
      kind: 'detail',
      id: `${item.id}__detail`,
      parentId: item.id,
      original: item.original,
    };
    cache.set(item.row, detail);
  }
  return detail;
}

// Rows get their expand state, and every expanded row is followed by a detail item rendered by
// DetailRow. Detail rows are as high as their content: DetailRow measures itself and the height
// feeds the body's item offsets (`rowHeights`); an unmeasured detail row is estimated at three
// rows. Wrappers are cached per row, so unchanged rows keep their memoised row component.
function useExpandableItems({ api, config, rows, rowHeight, state }) {
  const { expandable } = config;
  const [heights, setHeights] = useState(() => new Map());
  const rowCache = useRef(new WeakMap());
  const detailCache = useRef(new WeakMap());
  api.setDetailHeight = useCallback(({ id, height }) => {
    setHeights((previous) => {
      if (previous.get(id) === height) return previous;
      const next = new Map(previous);
      next.set(id, height);
      return next;
    });
  }, []);

  const result = useMemo(() => {
    if (!expandable) return null;
    const expandedIds = getExpandedIds(state.expanded);
    const items = [];
    let details = 0;
    rows.forEach((item) => {
      if (item === undefined || (item.kind ?? 'row') !== 'row') {
        items.push(item);
        return;
      }
      const wrapped = wrapRow({
        item,
        cache: rowCache.current,
        isExpandable: expandable.isExpandable,
        expandedIds,
      });
      items.push(wrapped);
      if (!wrapped.detailExpanded) return;
      items.push(getDetail({ item: wrapped, cache: detailCache.current }));
      details += 1;
    });
    return { items, details };
  }, [expandable, rows, state.expanded]);

  const rowHeights = useCallback(
    (item) => {
      if (item?.kind !== 'detail') return undefined;
      return heights.get(item.parentId) ?? rowHeight * 3;
    },
    [heights, rowHeight]
  );
  if (!result) return null;
  return { rows: result.items, rowHeights: result.details > 0 ? rowHeights : undefined };
}

export default useExpandableItems;
