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

import fitChips from '../fitChips.js';
import getTagTone from '../getTagTone.js';
import isEmptyValue from '../isEmptyValue.js';
import resolveOption from '../resolveOption.js';
import EmptyCell from './EmptyCell.js';
import TagChip from './TagChip.js';

// How many chips show: at most `cell.max`, and with `fit` (the host's content width and chip
// measurer, from Table) only the chips that fit whole, leaving room for the +N count.
function countShown({ column, fit, labels }) {
  const total = labels.length;
  const max = type.isInt(column.cell.max) ? Math.min(column.cell.max, total) : total;
  if (type.isNone(fit)) return max;
  const { measure } = fit;
  return fitChips({
    widths: labels.slice(0, max).map(({ label, icon }) => measure.tag({ label, icon })),
    total,
    moreWidth: (hidden) => measure.more(`+${hidden}`),
    gap: measure.gap,
    width: fit.width,
  });
}

// Renders `tag` (one value, or a list as the ag-grid tag cell allows) and
// `tags` (a list, with `max` tags shown and a +N count for the rest).
function TagCell({ value, row, column, components, fit }) {
  const items = (type.isArray(value) ? value : [value]).filter((item) => !isEmptyValue(item));
  if (items.length === 0) return <EmptyCell />;
  const labels = items.map((item) => {
    const option = resolveOption({ options: column.options, value: item });
    return { item, label: option?.label ?? String(item), icon: option?.icon };
  });
  const shown = countShown({ column, fit, labels });
  const hidden = items.length - shown;
  const chips = labels
    .slice(0, shown)
    .map(({ item, label, icon }, index) => (
      <TagChip
        key={`${index}-${String(item)}`}
        label={label}
        tone={getTagTone({ item, column, row })}
        icon={icon}
        components={components}
      />
    ));
  if (chips.length === 1 && hidden === 0) return chips[0];
  return (
    <span className="lf-table-chips">
      {chips}
      {hidden > 0 && <span className="lf-table-more">+{hidden}</span>}
    </span>
  );
}

export default TagCell;
