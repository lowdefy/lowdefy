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
import getCellLayout from '@lowdefy/blocks-antd/table/getCellLayout.js';

// Column types whose text reads on several lines. Tags, statuses, numbers and dates keep their
// single-line layout.
const WRAP_TYPES = new Set(['text', 'email', 'phone', 'url', 'link', 'html', 'relation']);

// Wrapped copies, one per column object, so layout columns stay stable across renders.
const wrapped = new WeakMap();

// With `view.wrap`, every text-like column without its own line layout (`wrap`, or `ellipsis`
// lines) wraps: its cells get the wrap class, and its rows are measured (isMeasuredColumn).
function getViewWrapColumn(column) {
  if (column.wrap || type.isInt(column.ellipsis) || !WRAP_TYPES.has(column.type)) return column;
  let copy = wrapped.get(column);
  if (copy === undefined) {
    const layout = getCellLayout({ ...column, wrap: true });
    copy = {
      ...column,
      wrap: true,
      compiled: { ...column.compiled, className: layout.className, style: layout.style },
    };
    wrapped.set(column, copy);
  }
  return copy;
}

export default getViewWrapColumn;
