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
 * A NumberInput's value kept within `min` and `max` and rounded to `precision`, as antd's
 * InputNumber settles its value when it loses focus.
 *
 * @param {Object} params
 * @param {number|null} params.value
 * @param {number} [params.min]
 * @param {number} [params.max]
 * @param {number} [params.precision]
 * @returns {number|null}
 */
function normalizeNumber({ max, min, precision, value }) {
  if (!type.isNumber(value)) {
    return null;
  }
  let result = value;
  if (type.isNumber(min) && result < min) result = min;
  if (type.isNumber(max) && result > max) result = max;
  if (type.isInt(precision)) {
    result = Number(result.toFixed(precision));
  }
  return result;
}

export default normalizeNumber;
