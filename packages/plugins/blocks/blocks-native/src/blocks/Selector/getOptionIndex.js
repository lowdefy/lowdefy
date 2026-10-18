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

import { serializer, type } from '@lowdefy/helpers';

import getOptionValue from './getOptionValue.js';

/**
 * The index of the option that holds the value, compared as the web Selector compares values
 * (a stable serialization, so object values match by content), or null when none does.
 *
 * @param {Object} params
 * @param {Array} params.options Primitives or `{ label, value }` objects.
 * @param {*} params.value
 * @returns {number|null}
 */
function getOptionIndex({ options, value }) {
  if (type.isNone(value)) {
    return null;
  }
  const serialized = serializer.serializeToString(value, { stable: true });
  const index = options.findIndex(
    (option) =>
      serializer.serializeToString(getOptionValue({ option }), { stable: true }) === serialized
  );
  return index === -1 ? null : index;
}

export default getOptionIndex;
