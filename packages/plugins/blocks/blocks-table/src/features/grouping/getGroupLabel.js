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

import getCellText from '@lowdefy/blocks-antd/table/getCellText.js';
import resolveOption from '@lowdefy/blocks-antd/table/resolveOption.js';

const EMPTY_LABEL = '(Empty)';

// A group header's label as text: the option label for enum values, else the value in the
// column's display format, and "(Empty)" for the group of empty values.
function getGroupLabel({ level, item }) {
  if (item.empty) return EMPTY_LABEL;
  const option = resolveOption({ options: level.options, value: item.value });
  if (option) return option.label;
  const text = getCellText({ column: level.column, value: item.value, row: {} });
  return text === '' ? String(item.value) : text;
}

export default getGroupLabel;
