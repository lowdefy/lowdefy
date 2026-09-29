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

// A server block that failed to load (D17): one row in place of the block's rows, saying so, with
// Retry to load only that block again. The rows already loaded stay. The message spans the
// visible width (sticky at the start), whatever the horizontal scroll.
function ServerErrorRow({ api, ariaRowIndex, className, displayIndex, item }) {
  return (
    <div
      aria-rowindex={ariaRowIndex}
      className={`${className} lf-table-error-row`}
      data-lf-error-row={item.key}
      data-row-index={displayIndex}
      role="row"
    >
      <div className="lf-table-gridcell lf-table-error-cell" role="gridcell">
        <span className="lf-table-error-text">Couldn&apos;t load rows</span>
        <span aria-hidden="true">·</span>
        <button
          className="lf-table-error-retry"
          data-lf-retry=""
          onClick={() =>
            api.serverStore.retry({
              listKey: item.listKey,
              groupPath: item.groupPath,
              index: item.index,
            })
          }
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default memo(ServerErrorRow);
