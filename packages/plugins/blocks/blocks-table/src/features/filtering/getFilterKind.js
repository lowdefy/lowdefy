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
import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';

const OPTION_TYPES = new Set(['tag', 'tags', 'status', 'people']);

const KIND_BY_FAMILY = {
  text: 'text',
  number: 'number',
  date: 'date',
  boolean: 'boolean',
  array: 'options',
};

// Which simple editor the column filter popover shows: a searchable value list (enums and
// arrays), text operators, a number range, a date range or relative date, yes/no, or empty/not
// empty for anything else.
function getFilterKind(column) {
  if (!type.isNone(column.options) || OPTION_TYPES.has(column.type)) return 'options';
  return KIND_BY_FAMILY[CELL_TYPE_FAMILIES[column.type]] ?? 'presence';
}

export default getFilterKind;
