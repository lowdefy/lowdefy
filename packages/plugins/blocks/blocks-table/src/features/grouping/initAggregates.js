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
import AGGREGATE_LABELS from '@lowdefy/blocks-antd/table/aggregateLabels.js';

import pickViewPart from '../../core/pickViewPart.js';

// The view's aggregate choices, `{ [columnKey]: fn | null }`. Entries for unknown columns or
// unknown functions are dropped; column `aggregate` defaults apply under these
// (resolveAggregates).
function initAggregates({ value, defaultView, config }) {
  const aggregates = pickViewPart({ value, defaultView, key: 'aggregates' });
  if (!type.isObject(aggregates)) return {};
  const resolved = {};
  Object.entries(aggregates).forEach(([key, fn]) => {
    if (!config.columnsByKey.has(key)) return;
    if (!type.isNull(fn) && !Object.hasOwn(AGGREGATE_LABELS, fn)) return;
    resolved[key] = fn;
  });
  return resolved;
}

export default initAggregates;
