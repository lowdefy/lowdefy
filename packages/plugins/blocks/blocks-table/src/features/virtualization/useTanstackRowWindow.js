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

import { useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// TanStack Virtual's row range, for the `positioned` strategy the benchmark compares against the
// translated window (per-row absolute transforms, count-based overscan of about one viewport).
function useTanstackRowWindow({ enabled, headerHeight, rowCount, rowHeight, scrollerRef }) {
  const estimateSize = useCallback(() => rowHeight, [rowHeight]);
  const virtualizer = useVirtualizer({
    count: rowCount,
    enabled,
    estimateSize,
    getScrollElement: () => scrollerRef.current,
    overscan: Math.ceil(900 / rowHeight),
    scrollMargin: headerHeight,
  });
  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight]);
  const items = virtualizer.getVirtualItems();
  if (!enabled || !items.length) return null;
  return { rowStart: items[0].index, rowEnd: items[items.length - 1].index + 1 };
}

export default useTanstackRowWindow;
