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
 * The text a NumberInput shows for its value: fixed to `precision` decimals when set, with the
 * input's decimal separator.
 *
 * @param {Object} params
 * @param {number|null} params.value
 * @param {number} [params.precision]
 * @param {string} [params.decimalSeparator]
 * @returns {string}
 */
function formatNumber({ decimalSeparator, precision, value }) {
  if (!type.isNumber(value)) {
    return '';
  }
  const text = type.isInt(precision) ? value.toFixed(precision) : String(value);
  if (!type.isString(decimalSeparator)) {
    return text;
  }
  return text.replace('.', decimalSeparator);
}

export default formatNumber;
