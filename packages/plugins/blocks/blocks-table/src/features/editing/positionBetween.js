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

export const POSITION_STEP = 1024;
const MIN_GAP = 1e-6;

// A row's position between two neighbours' (fractional indexing): the midpoint, one step past
// the only neighbour at either end, or the first step in an empty list. Null when there is no
// room (the gap is below MIN_GAP, the neighbours are out of order, or a neighbour has no numeric
// position): the caller renumbers the list then.
function positionBetween({ before, after } = {}) {
  if (type.isUndefined(before) && type.isUndefined(after)) return POSITION_STEP;
  if (type.isUndefined(before)) return type.isNumber(after) ? after - POSITION_STEP : null;
  if (type.isUndefined(after)) return type.isNumber(before) ? before + POSITION_STEP : null;
  if (!type.isNumber(before) || !type.isNumber(after)) return null;
  if (after - before < MIN_GAP) return null;
  return (before + after) / 2;
}

export default positionBetween;
