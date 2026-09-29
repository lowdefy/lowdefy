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
import getSkeletonRowCount from '@lowdefy/blocks-antd/table/getSkeletonRowCount.js';

const DEFAULT_MAX_HEIGHT = 600;

// The skeleton rows a Table shows while it loads: enough to fill its scroller below the header,
// which is `height` for a fixed-height table (measured when it is a CSS length) and `maxHeight`
// for one that grows with its rows; capped at the page size when paginated and at the rows
// already known (the fallback, when the rows are there and only the code is loading).
function getTableSkeletonCount({
  height,
  maxHeight,
  headerHeight,
  measuredHeight,
  pageSize,
  rowCount,
  rowHeight,
}) {
  let scrollerHeight = DEFAULT_MAX_HEIGHT;
  if (type.isNumber(height)) {
    scrollerHeight = height;
  } else if (!type.isNone(height) && measuredHeight > 0) {
    scrollerHeight = measuredHeight;
  } else if (type.isNone(height) && type.isNumber(maxHeight)) {
    scrollerHeight = maxHeight;
  }
  return getSkeletonRowCount({
    bodyHeight: scrollerHeight - headerHeight,
    rowHeight,
    pageSize,
    rowCount,
  });
}

export default getTableSkeletonCount;
