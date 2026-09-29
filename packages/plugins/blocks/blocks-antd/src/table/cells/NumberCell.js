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
import formatNumber from '@lowdefy/block-utils/format/formatNumber.js';

import getNumberConfig from '../getNumberConfig.js';
import isEmptyValue from '../isEmptyValue.js';
import pickThresholdColor from '../pickThresholdColor.js';
import resolveToneColor from '../resolveToneColor.js';
import EmptyCell from './EmptyCell.js';

// The ag-grid number cell colour keys: `signColor` colours by sign, otherwise
// `thresholds` + `colors` pick by value, otherwise `color` applies to all.
function getColor({ n, cell }) {
  if (cell.signColor === true) {
    if (n > 0) return cell.positiveColor ?? 'success';
    if (n < 0) return cell.negativeColor ?? 'error';
    return cell.zeroColor ?? cell.color;
  }
  return (
    pickThresholdColor({ value: n, thresholds: cell.thresholds, colors: cell.colors }) ?? cell.color
  );
}

function NumberCell({ value, column }) {
  if (isEmptyValue(value)) return <EmptyCell />;
  const n = Number(value);
  if (Number.isNaN(n)) return <EmptyCell />;
  const text = formatNumber({ value: n, config: getNumberConfig({ column }) });
  const color = resolveToneColor({ color: getColor({ n, cell: column.cell }), text: true });
  return (
    <span className="lf-table-number" style={color ? { color } : undefined}>
      {text}
    </span>
  );
}

export default NumberCell;
