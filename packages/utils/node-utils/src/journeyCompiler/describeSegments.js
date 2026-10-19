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

import describeSegment from './describeSegment.js';
import prepareSegments from './prepareSegments.js';

// The records' segments of one source, folded and described (describeSegment):
// each one's journey, sequence and hash, who did it and when. Segments with no
// interaction step are left out. `filters` ({ since, until }) bound the window.
function describeSegments({ records, blockMetas = {}, routeTable, source, filters = {} }) {
  const { segments, dropped } = prepareSegments({ records, source, filters });
  return {
    segments: segments
      .map((segment) => describeSegment({ records: segment, blockMetas, routeTable, source }))
      .filter((segment) => !type.isUndefined(segment)),
    dropped,
  };
}

export default describeSegments;
