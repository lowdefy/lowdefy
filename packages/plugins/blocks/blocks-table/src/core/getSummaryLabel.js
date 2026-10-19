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

import AGGREGATE_LABELS from '@lowdefy/blocks-antd/table/aggregateLabels.js';

import AGGREGATE_SHORT_LABELS from './aggregateShortLabels.js';

// What a value wider than its cell keeps beside a short label: it ends with an ellipsis anyway,
// and a few characters of it with the label say more than more characters without.
const MIN_VALUE_WIDTH = 28;

// The label a summary cell shows next to its value in `width`: the full label when it fits with
// the whole value, else the short form (Σ, Avg, ...) when that fits with the whole value. A label
// never makes a value that fits end with an ellipsis: without room for either, a value that fits
// shows alone, and a value too wide for the cell anyway keeps the short label beside its start.
// The cell's title always holds the full label and value.
function getSummaryLabel({ fn, measure, text, width }) {
  const value = measure.summaryValue(text);
  const full = AGGREGATE_LABELS[fn];
  if (value + measure.summaryGap + measure.summaryLabel(full) <= width) return full;
  const short = AGGREGATE_SHORT_LABELS[fn] ?? full;
  const room = width - measure.summaryGap - measure.summaryLabel(short);
  if (value <= room) return short;
  if (value > width && room >= MIN_VALUE_WIDTH) return short;
  return null;
}

export default getSummaryLabel;
