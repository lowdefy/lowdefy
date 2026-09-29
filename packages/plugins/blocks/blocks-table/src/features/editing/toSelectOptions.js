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
import StatusCell from '@lowdefy/blocks-antd/table/cells/StatusCell.js';
import TagCell from '@lowdefy/blocks-antd/table/cells/TagCell.js';

// The select editor's options with the look of the cell: a status dot or a tag chip in the
// value's colour (the shared cell renderers, for one value), with the label as `text` for search
// and as the option's `title`.
function toSelectOptions({ components, spec, row }) {
  const { column } = spec;
  return (spec.options ?? []).map((option) => ({
    label:
      column.type === 'status' ? (
        <StatusCell column={column} row={row} value={option.value} />
      ) : (
        <TagCell column={column} components={components} row={row} value={option.value} />
      ),
    text: option.label,
    title: option.label,
    value: option.value,
  }));
}

export default toSelectOptions;
