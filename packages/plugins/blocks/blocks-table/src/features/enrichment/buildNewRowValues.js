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

import { set, type } from '@lowdefy/helpers';

import coerceCellValue from '../editing/coerceCellValue.js';
import createValueSpec from './createValueSpec.js';

const TEXT_KINDS = new Set(['text', 'date', 'datetime']);

// The new-row editor's drafts as onRowAdd `values`: each filled field set at its column's
// `field` path, text typed into date columns parsed as dates. Empty fields are left out. Returns
// `{ values }`, or `{ error }` naming the first field that does not fit its column.
function buildNewRowValues({ columns, drafts }) {
  const values = {};
  for (const column of columns) {
    const draft = drafts[column.key];
    if (type.isNone(draft) || draft === '' || (type.isArray(draft) && draft.length === 0)) continue;
    const spec = createValueSpec(column);
    let value = draft;
    if (TEXT_KINDS.has(spec.kind) && type.isString(draft)) {
      const coerced = coerceCellValue({ spec, text: draft });
      if (coerced.error) return { error: `${column.title}: ${coerced.error}` };
      value = coerced.value;
    }
    set(values, column.field, value);
  }
  return { values };
}

export default buildNewRowValues;
