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
import compileCondition from '@lowdefy/blocks-antd/table/compileCondition.js';
import normalizeOptions from '@lowdefy/blocks-antd/table/normalizeOptions.js';

import collectRawColumns from './collectRawColumns.js';
import getEditorKind from './getEditorKind.js';

const DEFAULT_RATING_MAX = 5;

function getEditable({ raw, defaultColumn, column }) {
  if (!type.isUndefined(raw?.editable)) return raw.editable;
  if (!type.isUndefined(defaultColumn?.editable)) return defaultColumn.editable;
  return column.editable;
}

// Everything editing needs per column, compiled once per column config: the editor kind, the
// row-level `editable: { when }` test, the `validate` tests and `required`, and the `default`
// for added rows. Conditions compile with the shared condition core, so `editable.when` and
// `validate[].pass` read exactly like filters and rules.
function createEditSpecs({ columns, rawColumns, defaultColumn }) {
  const rawByKey = collectRawColumns({ columns: rawColumns });
  const columnsByKey = Object.fromEntries(columns.map((column) => [column.key, column]));
  const now = dayjs();
  const specs = new Map();
  columns.forEach((column) => {
    const raw = rawByKey.get(column.key);
    const kind = getEditorKind(column.type);
    const editable = getEditable({ raw, defaultColumn, column });
    const validate = (raw?.validate ?? column.validate ?? []).map((rule) => ({
      message: rule.message ?? 'Invalid value.',
      test: compileCondition({ condition: rule.pass, columnsByKey, column, now }),
    }));
    specs.set(column.key, {
      column,
      default: raw?.default,
      editable: kind !== null && (editable === true || type.isObject(editable)),
      field: column.field,
      key: column.key,
      kind,
      max: column.cell?.max ?? DEFAULT_RATING_MAX,
      options: normalizeOptions(column.options),
      required: raw?.required === true,
      type: column.type,
      validate,
      when: type.isObject(editable)
        ? compileCondition({ condition: editable.when, columnsByKey, column, now })
        : null,
    });
  });
  return specs;
}

export default createEditSpecs;
