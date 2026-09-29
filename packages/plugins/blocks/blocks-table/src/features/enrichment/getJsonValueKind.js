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

// The kind of a JSON tree node's value, which colours its preview: `string`, `number`,
// `boolean`, `null`, `date`, `array` or `object`.
function getJsonValueKind(value) {
  if (type.isNone(value)) return 'null';
  if (type.isArray(value)) return 'array';
  if (type.isDate(value)) return 'date';
  if (type.isObject(value)) return 'object';
  if (type.isString(value)) return 'string';
  if (type.isNumber(value)) return 'number';
  if (type.isBoolean(value)) return 'boolean';
  return 'string';
}

export default getJsonValueKind;
