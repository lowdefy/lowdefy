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

// The colour for a number from ascending `thresholds` and one more `colors`
// entry than thresholds: below thresholds[0] takes colors[0], and so on, with
// the last colour for values at or above the last threshold. Undefined when
// the cell sets no thresholds.
function pickThresholdColor({ value, thresholds, colors }) {
  if (!type.isArray(thresholds) || !type.isArray(colors) || colors.length === 0) {
    return undefined;
  }
  for (let i = 0; i < thresholds.length; i += 1) {
    if (value < thresholds[i]) return colors[Math.min(i, colors.length - 1)];
  }
  return colors[colors.length - 1];
}

export default pickThresholdColor;
