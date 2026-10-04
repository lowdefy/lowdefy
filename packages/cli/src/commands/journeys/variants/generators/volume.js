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

import otherDataSet from '../otherDataSet.js';

// Volume: the same steps as the journey's user, by name, on the data set
// --volume-data names (one with many rows): the flow completes within the
// journey's step timeouts.
function volume({ journey, dataSet, volumeDataSet }) {
  const target = otherDataSet({ journey, dataSet, other: volumeDataSet, flag: '--volume-data' });
  if (!type.isUndefined(target.skipped)) {
    return target;
  }
  return [
    {
      kind: 'volume',
      detail: `on ${target.name}`,
      overrides: { data: target.name },
      steps: journey.steps,
    },
  ];
}

export default volume;
