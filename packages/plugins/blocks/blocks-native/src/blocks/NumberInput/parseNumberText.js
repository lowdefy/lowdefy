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

const NUMBER_PATTERN = /^-?\d*\.?\d*$/;

/**
 * Reads the number typed in a NumberInput. An empty input is null. Text on its way to a number
 * ("-", "1.") or that is no number at all is not valid, so the value keeps its last number
 * while the person types.
 *
 * @param {Object} params
 * @param {string} params.text
 * @param {string} [params.decimalSeparator] The separator the input shows, '.' when not set.
 * @returns {{ valid: boolean, value: number|null }}
 */
function parseNumberText({ decimalSeparator, text }) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { valid: true, value: null };
  }
  const normalized = type.isString(decimalSeparator)
    ? trimmed.split(decimalSeparator).join('.')
    : trimmed;
  if (!NUMBER_PATTERN.test(normalized) || !/\d/.test(normalized)) {
    return { valid: false, value: null };
  }
  return { valid: true, value: Number(normalized) };
}

export default parseNumberText;
