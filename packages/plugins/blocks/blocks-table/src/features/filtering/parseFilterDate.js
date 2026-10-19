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

import dayjs from 'dayjs';
import { type } from '@lowdefy/helpers';
import isEmptyValue from '@lowdefy/blocks-antd/table/isEmptyValue.js';

// A filter date value as the dayjs object antd pickers take; null when empty or unreadable.
function parseFilterDate(value) {
  if (isEmptyValue(value) || type.isObject(value)) return null;
  const date = dayjs(value);
  return date.isValid() ? date : null;
}

export default parseFilterDate;
