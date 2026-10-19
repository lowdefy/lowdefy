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

import isEmptyValue from '../isEmptyValue.js';
import resolveToneColor from '../resolveToneColor.js';
import EmptyCell from './EmptyCell.js';

// Stars out of `max` (default 5), the value rounded to a whole star.
function RatingCell({ value, column }) {
  if (isEmptyValue(value)) return <EmptyCell />;
  const n = Number(value);
  if (Number.isNaN(n)) return <EmptyCell />;
  const max = column.cell.max ?? 5;
  const filled = Math.max(0, Math.min(max, Math.round(n)));
  const color = resolveToneColor({ color: column.cell.color });
  return (
    <span
      className="lf-table-rating"
      role="img"
      aria-label={`${n} of ${max}`}
      title={`${n} / ${max}`}
    >
      <span className="lf-table-rating-on" style={color ? { color } : undefined}>
        {'★'.repeat(filled)}
      </span>
      <span className="lf-table-rating-off">{'★'.repeat(max - filled)}</span>
    </span>
  );
}

export default RatingCell;
