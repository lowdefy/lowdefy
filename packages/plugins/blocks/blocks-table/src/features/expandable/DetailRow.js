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
// viewport (it stays put while the table scrolls sideways). Its height is its content's; it
// measures itself so the window places the rows below it.
function DetailRow({ api, displayIndex, item }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const report = () =>
      api.setDetailHeight({ id: item.parentId, height: element.getBoundingClientRect().height });
    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, [api, item.parentId]);
  const html = api.config.expandable.render({
    row: item.original,
    rowKey: api.config.getKey(item.original),
  });
  return (
    <div
      aria-rowindex={displayIndex + 2}
      className="lf-table-detail"
      data-detail-for={item.parentId}
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
