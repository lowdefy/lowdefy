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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

function inferStringType(value) {
  if (DATE_PATTERN.test(value)) return 'date';
  if (DATETIME_PATTERN.test(value) && !Number.isNaN(Date.parse(value))) return 'datetime';
  if (EMAIL_PATTERN.test(value)) return 'email';
  if (URL_PATTERN.test(value)) return 'url';
  return 'text';
}

// The column type a value from a raw result reads best as ("Add as column" in the cell details
// panel): numbers, booleans, dates, emails and URLs by their shape, lists of strings as tags,
// other objects and lists as json, everything else text.
function inferColumnType(value) {
  if (type.isNumber(value)) return 'number';
  if (type.isBoolean(value)) return 'boolean';
  if (type.isDate(value)) return 'datetime';
  if (type.isString(value)) return inferStringType(value);
  if (type.isArray(value)) {
    return value.length > 0 && value.every((item) => type.isString(item)) ? 'tags' : 'json';
  }
  if (type.isObject(value)) return 'json';
  return 'text';
}

export default inferColumnType;
