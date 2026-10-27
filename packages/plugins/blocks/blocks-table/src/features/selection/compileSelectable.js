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
import compileCondition from '@lowdefy/blocks-antd/table/compileCondition.js';

import resolveRelativeDates from '../filtering/resolveRelativeDates.js';

// `rowSelection.selectable`, a table condition, compiled into a row test, or null when every row
// can be selected. The header and group checkboxes ask it of every filtered row on each render,
// so each row's answer is kept until the row object changes.
function compileSelectable({ rowSelection, columnsByKey, user }) {
  if (!type.isObject(rowSelection) || type.isNone(rowSelection.selectable)) return null;
  if (!type.isObject(rowSelection.selectable)) {
    throw new Error(
      `Table "rowSelection.selectable" must be a condition. Received ${JSON.stringify(
        rowSelection.selectable
      )}.`
    );
  }
  const test = compileCondition({
    condition: resolveRelativeDates({ condition: rowSelection.selectable }),
    columnsByKey,
    user,
  });
  const answers = new WeakMap();
  return function isSelectable(row) {
    if (!answers.has(row)) answers.set(row, test(row));
    return answers.get(row);
  };
}

export default compileSelectable;
