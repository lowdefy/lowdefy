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

import SkeletonRow from './SkeletonRow.js';

// The body of a table that is loading its first rows (D17 initial): `count` type-shaped skeleton
// rows at the current density, exactly the height the rows will take. The lazy block's fallback
// renders the same rows from the column config, so the swap to the table is invisible.
function SkeletonRows({ ariaRowOffset, centerCols, count, layout, rowClassName }) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(
      <SkeletonRow
        ariaRowIndex={i + ariaRowOffset}
        centerCols={centerCols}
        className={rowClassName}
        displayIndex={i}
        endCols={layout.end}
        key={i}
        startCols={layout.start}
      />
    );
  }
  return (
    <div className="lf-table-body" data-lf-skeleton-body="" role="rowgroup">
      {rows}
    </div>
  );
}

export default SkeletonRows;
