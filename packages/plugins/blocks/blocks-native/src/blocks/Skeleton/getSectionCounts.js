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

/**
 * The rows in each section of an inset group: `count` is one section's rows, or a list of each
 * section's, so a skeleton can take the shape of the sections it stands in for.
 *
 * @param {Object} params
 * @param {number|number[]} [params.count]
 * @param {number} params.fallback The rows of the one section when `count` is not set.
 * @returns {number[]}
 */
function getSectionCounts({ count, fallback }) {
  if (type.isArray(count)) return count;
  if (type.isNone(count)) return [fallback];
  return [count];
}

export default getSectionCounts;
