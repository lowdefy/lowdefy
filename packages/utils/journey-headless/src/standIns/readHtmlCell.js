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

import isEmptyValue from '@lowdefy/blocks-antd/table/isEmptyValue.js';
import readColumnValue from '@lowdefy/blocks-antd/table/readColumnValue.js';
import { type } from '@lowdefy/helpers';

// The html a Table `html` cell draws for a row, as blocks-antd's HtmlCell works it out: the
// column's compiled `template` over `{ value, row }`, else the value itself, or null when that is
// empty (the cell then draws nothing).
function readHtmlCell({ column, row }) {
  const value = readColumnValue({ column, row });
  let html = value;
  if (type.isString(column.cell.template)) {
    html = column.compiled.template({ value, row });
  }
  if (isEmptyValue(html)) {
    return null;
  }
  return String(html);
}

export default readHtmlCell;
