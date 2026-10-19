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

// `expandable: { template, rowExpandable: { when } }`. The template is nunjucks (autoescaped, so
// `| safe` is needed to insert HTML from a field), compiled once and rendered with
// `{ row, rowKey }` (`compileTemplate`, the compiler useTableConfig loads when templates are
// used); `rowExpandable.when` is a table condition tested against the row.
function normalizeExpandable({ expandable, columns, user, compileTemplate }) {
  if (type.isNone(expandable)) return null;
  if (!type.isObject(expandable)) {
    throw new Error(
      `Table "expandable" must be an object. Received ${JSON.stringify(expandable)}.`
    );
  }
  if (!type.isString(expandable.template)) {
    throw new Error(
      `Table "expandable" requires "template", a nunjucks HTML string. Received ${JSON.stringify(
        expandable.template
      )}.`
    );
  }
  const render = compileTemplate(expandable.template);
  let isExpandable = () => true;
  if (!type.isNone(expandable.rowExpandable)) {
    const when = expandable.rowExpandable?.when;
    if (!type.isObject(when)) {
      throw new Error(
        `Table "expandable.rowExpandable" must be { when: Condition }. Received ${JSON.stringify(
          expandable.rowExpandable
        )}.`
      );
    }
    const columnsByKey = Object.fromEntries(columns.map((column) => [column.key, column]));
    const matches = compileCondition({ condition: when, columnsByKey, user });
    isExpandable = (row) => matches(row);
  }
  return { render, isExpandable };
}

export default normalizeExpandable;
