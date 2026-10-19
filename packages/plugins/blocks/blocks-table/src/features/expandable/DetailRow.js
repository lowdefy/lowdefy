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

import React, { memo, useLayoutEffect, useRef } from 'react';
import { renderHtml } from '@lowdefy/block-utils';

// The expanded content of a row: the `expandable.template` HTML in one cell as wide as the
// viewport (it stays put while the table scrolls sideways). Its height is its content's: the body
// measures it after each window render like any measured item (`data-measure-key`), and it
// reports again when its content resizes (images loading, fonts), so the rows below move.
function DetailRow({ api, ariaRowIndex, displayIndex, item }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const observer = new ResizeObserver(() => api.measureRows([element]));
    observer.observe(element);
    return () => observer.disconnect();
  }, [api]);
  const html = api.config.expandable.render({
    row: item.original,
    rowKey: api.config.getKey(item.original),
  });
  return (
    <div
      aria-rowindex={ariaRowIndex}
      className="lf-table-detail"
      data-detail-for={item.parentId}
      data-measure-key={`detail:${item.key}`}
      data-row-index={displayIndex}
      ref={ref}
      role="row"
    >
      <div
        aria-colspan={api.layout.cols.length}
        className="lf-table-detail-cell"
        data-col-index="0"
        data-lf-cell=""
        role="gridcell"
        tabIndex={-1}
      >
        {renderHtml({ html, methods: api.methods })}
      </div>
    </div>
  );
}

export default memo(DetailRow);
