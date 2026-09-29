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

import React from 'react';

import getSkeletonShape from './getSkeletonShape.js';
import getSkeletonWidth from './getSkeletonWidth.js';
import './tableLoading.css';

// A loading cell's placeholder (tier 0: plain spans, no hooks), shaped by the column type. The
// shimmer is one CSS animation on the row (tableLoading.css), not one per cell.
function SkeletonCell({ column, rowIndex }) {
  const shape = getSkeletonShape(column.type);
  const style = { '--lf-skeleton-w': `${getSkeletonWidth({ rowIndex, columnKey: column.key })}%` };
  let children = null;
  if (shape === 'person') children = <span className="lf-table-skeleton-circle" />;
  if (shape === 'buttons') {
    children = (
      <>
        <span className="lf-table-skeleton-square" />
        <span className="lf-table-skeleton-square" />
      </>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="lf-table-skeleton"
      data-align={column.align === 'start' ? undefined : column.align}
      data-shape={shape}
      style={style}
    >
      {children}
    </span>
  );
}

export default SkeletonCell;
