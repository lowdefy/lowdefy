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
 * The text a native picker shows for an option. A native picker draws plain text, so the html
 * a web option label may hold is shown without its tags.
 *
 * @param {Object} params
 * @param {*} params.option A primitive or a `{ label, value }` object.
 * @returns {string}
 */
function getOptionLabel({ option }) {
  if (type.isPrimitive(option)) {
    return `${option}`;
  }
  if (type.isString(option.label)) {
    return option.label.replace(/<[^>]*>/g, '');
  }
  return `${option.value}`;
}

export default getOptionLabel;
