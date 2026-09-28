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

import React, { memo } from 'react';

// A row that is not loaded yet (server mode): the row's box with a skeleton bar per data cell,
// so fast scrolling shows placeholders instead of blank space.
function SkeletonRow({ ariaRowIndex, centerCols, className, displayIndex, endCols, startCols }) {
  const renderCells = (cols) =>
    cols.map((col) => (
      <div
        className="lf-table-gridcell"
        data-col-index={col.index}
        data-lf-cell=""
        data-pinned={col.region === 'center' ? undefined : col.region}
        key={col.key}
        role="gridcell"
        style={col.style}
        tabIndex={-1}
      >
        {col.special ? null : <span className="lf-table-skeleton-bar" />}
      </div>
    ));
  return (
    <div
      aria-busy="true"
      aria-rowindex={ariaRowIndex}
      className={className}
      data-row-index={displayIndex}
      data-skeleton=""
      role="row"
    >
      {renderCells(startCols)}
      <div className="lf-table-center">{renderCells(centerCols)}</div>
      {renderCells(endCols)}
    </div>
  );
}

export default memo(SkeletonRow);
