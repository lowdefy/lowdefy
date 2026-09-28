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
import pickThresholdColor from '../pickThresholdColor.js';
import resolveToneColor from '../resolveToneColor.js';
import EmptyCell from './EmptyCell.js';

// A bar filled to value / max (default 100) with the value beside it. The bar
// colour is `color`, or picked by `thresholds` + `colors` (the ag-grid progress
// keys), or the primary colour.
function ProgressCell({ value, column }) {
  const { cell } = column;
  if (isEmptyValue(value)) return <EmptyCell placeholder={cell.nullLabel} />;
  const n = Number(value);
  if (Number.isNaN(n)) return <EmptyCell />;
  const max = cell.max ?? 100;
  const percent = Math.max(0, Math.min(100, (n / max) * 100));
  const color =
    pickThresholdColor({ value: n, thresholds: cell.thresholds, colors: cell.colors }) ??
    cell.color ??
    'var(--ant-color-primary)';
  return (
    <span className="lf-table-progress" style={{ '--lf-table-tone': resolveToneColor({ color }) }}>
      <span
        className="lf-table-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={n}
      >
        <span className="lf-table-progress-fill" style={{ width: `${percent}%` }} />
      </span>
      {cell.showValue !== false && (
        <span className="lf-table-progress-text">
          {n}
          {cell.suffix ?? '%'}
        </span>
      )}
    </span>
  );
}

export default ProgressCell;
