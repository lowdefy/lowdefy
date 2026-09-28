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

const SKELETON_ROWS = 5;

function LoadingRows({ layout }) {
  const rows = [];
  for (let i = 0; i < SKELETON_ROWS; i++) {
    rows.push(
      <div aria-hidden="true" className="lf-table-row" key={i}>
        {layout.cols.map((col) => (
          <div className="lf-table-cell" key={col.key} style={{ width: col.width }}>
            {col.special ? null : <span className="lf-table-skeleton-bar" />}
          </div>
        ))}
      </div>
    );
  }
  return <div className="lf-table-body">{rows}</div>;
}

export default LoadingRows;
