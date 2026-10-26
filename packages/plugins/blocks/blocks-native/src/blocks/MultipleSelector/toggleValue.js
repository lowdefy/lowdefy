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
import { serializer } from '@lowdefy/helpers';

function serialize(value) {
  return serializer.serializeToString(value, { stable: true });
}

/**
 * Whether two lists of values hold the same values, in any order, compared as the Selector
 * compares an option's value (a stable serialization, so object values match by content).
 *
 * @param {Array} first
 * @param {Array} second
 * @returns {boolean}
 */
function isSameValues(first, second) {
  const a = new Set(first.map(serialize));
  const b = new Set(second.map(serialize));
  return a.size === b.size && [...a].every((key) => b.has(key));
}

/**
 * The values with the value added, at the end, or taken out when they hold it.
 *
 * @param {Object} params
 * @param {*} params.value
 * @param {Array} params.values
 * @returns {Array}
 */
function toggleValue({ value, values }) {
  const key = serialize(value);
  const kept = values.filter((item) => serialize(item) !== key);
  return kept.length === values.length ? [...values, value] : kept;
}

export { isSameValues, toggleValue };
