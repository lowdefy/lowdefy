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

const zeroWhenNoRows = [
  'count',
  'countDistinct',
  'countEmpty',
  'countNotEmpty',
  'percentEmpty',
  'sum',
];

// doc is undefined when no rows matched: $group emits no document for an empty input.
function readAggregates({ doc, specs }) {
  const aggregates = {};
  specs.forEach(({ key, fn, name }) => {
    const value = doc?.[name];
    if (type.isNone(value)) {
      aggregates[key] = zeroWhenNoRows.includes(fn) ? 0 : null;
      return;
    }
    aggregates[key] = value;
  });
  return aggregates;
}

export default readAggregates;
