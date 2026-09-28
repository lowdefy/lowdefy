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
import { type } from '@lowdefy/helpers';

import getTagTone from '../getTagTone.js';
import isEmptyValue from '../isEmptyValue.js';
import resolveOption from '../resolveOption.js';
import EmptyCell from './EmptyCell.js';
import TagChip from './TagChip.js';

// Renders `tag` (one value, or a list as the ag-grid tag cell allows) and
// `tags` (a list, with `max` tags shown and a +N count for the rest).
function TagCell({ value, row, column, components }) {
  const items = (type.isArray(value) ? value : [value]).filter((item) => !isEmptyValue(item));
  if (items.length === 0) return <EmptyCell />;
  const max = type.isInt(column.cell.max) ? column.cell.max : items.length;
  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;
  const chips = shown.map((item, index) => {
    const option = resolveOption({ options: column.options, value: item });
    return (
      <TagChip
        key={`${index}-${String(item)}`}
        label={option?.label ?? String(item)}
        tone={getTagTone({ item, column, row })}
        icon={option?.icon}
        components={components}
      />
    );
  });
  if (chips.length === 1 && hidden === 0) return chips[0];
  return (
    <span className="lf-table-chips">
      {chips}
      {hidden > 0 && <span className="lf-table-more">+{hidden}</span>}
    </span>
  );
}

export default TagCell;
