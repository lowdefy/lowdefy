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

import { Platform } from 'react-native';
import { type } from '@lowdefy/helpers';

/**
 * The keyboard a NumberInput opens. The iOS number and decimal pads have no minus key, so an
 * input that allows negative numbers opens the numbers and punctuation keyboard there.
 *
 * @param {Object} params
 * @param {number} [params.min]
 * @param {number} [params.precision]
 * @returns {string} A React Native keyboardType.
 */
function getNumberKeyboardType({ min, precision }) {
  const allowsNegative = !type.isNumber(min) || min < 0;
  if (allowsNegative) {
    return Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';
  }
  return precision === 0 ? 'number-pad' : 'decimal-pad';
}

export default getNumberKeyboardType;
