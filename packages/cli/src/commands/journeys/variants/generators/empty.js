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

import findDataSteps from '../findDataSteps.js';
import otherDataSet from '../otherDataSet.js';

// Empty: the journey's user, by name, on the data set --empty-data names
// (one with no rows), walks up to the first data step and sees the block that
// step targets: the page renders its empty state and does not crash.
function empty({ journey, dataSet, emptyDataSet }) {
  const target = otherDataSet({ journey, dataSet, other: emptyDataSet, flag: '--empty-data' });
  if (!type.isUndefined(target.skipped)) {
    return target;
  }
  const [first] = findDataSteps({ journey, dataSet });
  if (type.isUndefined(first)) {
    return { skipped: 'no step selects or asserts by data set values' };
  }
  if (type.isNull(first.blockId)) {
    return { skipped: 'the first data step targets no block' };
  }
  return [
    {
      kind: 'empty',
      detail: `on ${target.name}`,
      overrides: { data: target.name },
      steps: [...journey.steps.slice(0, first.index), { expect: { visible: first.blockId } }],
    },
  ];
}

export default empty;
