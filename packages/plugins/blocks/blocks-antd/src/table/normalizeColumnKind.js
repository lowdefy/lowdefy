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

import AI_OUTPUT_TYPES from './aiOutputTypes.js';
import COLUMN_KINDS from './columnKinds.js';
import findTemplateProblem from './findTemplateProblem.js';

const KIND_KEYS = [...new Set(Object.values(COLUMN_KINDS).flat())];
const COMPUTED_KINDS = new Set(['formula', 'enrichment', 'ai', 'extract']);

function fail(key, message) {
  throw new Error(`Table column "${key}" ${message}`);
}

function checkKindKeys({ column, key, kind }) {
  const allowed = COLUMN_KINDS[kind] ?? [];
  KIND_KEYS.forEach((name) => {
    if (type.isUndefined(column[name]) || allowed.includes(name)) return;
    const owners = Object.keys(COLUMN_KINDS).filter((owner) => COLUMN_KINDS[owner].includes(name));
    fail(
      key,
      `has "${name}", which needs kind ${owners.map((owner) => `"${owner}"`).join(' or ')}.`
    );
  });
}

function checkInputs({ inputs, key }) {
  if (type.isUndefined(inputs)) return {};
  if (!type.isObject(inputs)) {
    fail(
      key,
      `"inputs" must be an object of { column } or { value }. Received ${JSON.stringify(inputs)}.`
    );
  }
  Object.entries(inputs).forEach(([param, source]) => {
    const isColumn = type.isObject(source) && type.isString(source.column);
    const isValue = type.isObject(source) && Object.hasOwn(source, 'value');
    const extraKeys = type.isObject(source)
      ? Object.keys(source).filter(
          (name) => name !== 'column' && name !== 'value' && name !== 'required'
        )
      : [];
    const badRequired =
      type.isObject(source) &&
      !type.isUndefined(source.required) &&
      !type.isBoolean(source.required);
    if (isColumn === isValue || extraKeys.length > 0 || badRequired) {
      fail(
        key,
        `input "${param}" must be { column: <column key>, required? } or { value: <literal> }. Received ${JSON.stringify(
          source
        )}.`
      );
    }
  });
  return inputs;
}

function checkOutputType({ output, key }) {
  if (type.isUndefined(output)) return undefined;
  if (!type.isObject(output)) {
    fail(
      key,
      `"output" must be { type, options? } for kind "ai". Received ${JSON.stringify(output)}.`
    );
  }
  if (!type.isUndefined(output.type) && !AI_OUTPUT_TYPES.includes(output.type)) {
    fail(
      key,
      `has output type "${output.type}". An ai column answers one of: ${AI_OUTPUT_TYPES.join(
        ', '
      )}.`
    );
  }
  if (
    !type.isUndefined(output.options) &&
    (!type.isArray(output.options) || !['tag', 'tags'].includes(output.type))
  ) {
    fail(key, `"output.options" must be a list, for output type "tag" or "tags".`);
  }
  return output;
}

function checkString({ column, key, name, required }) {
  const value = column[name];
  if (type.isUndefined(value) && !required) return undefined;
  if (!type.isString(value) || (required && value.trim() === '')) {
    fail(key, `requires "${name}" (a string). Received ${JSON.stringify(value)}.`);
  }
  return value;
}

function checkTemplate({ column, key, name }) {
  const template = checkString({ column, key, name, required: true });
  const problem = findTemplateProblem(template);
  if (problem !== null) fail(key, `"${name}": ${problem}`);
  return template;
}

function checkAutoRun({ column, key }) {
  if (type.isUndefined(column.autoRun) || type.isBoolean(column.autoRun)) {
    return column.autoRun === true;
  }
  return fail(key, `"autoRun" must be true or false. Received ${JSON.stringify(column.autoRun)}.`);
}

function getStateField({ column, key, kind }) {
  if (!type.isUndefined(column.status)) {
    if (!type.isObject(column.status) || !type.isString(column.status.field)) {
      fail(key, `"status" must be { field: <path> }. Received ${JSON.stringify(column.status)}.`);
    }
    return column.status.field;
  }
  if (kind === 'enrichment' || kind === 'ai') return `_enrich.${key}`;
  return undefined;
}

// The kind part of a leaf column (columnKinds.js): what the kind computes from, where its value
// and run state live, and its default type. Enrichment and ai columns read their value from
// `_enrich.<key>.value` and their run state from `_enrich.<key>` (or `status.field`). Kind keys on
// a column of another kind, and `editable: true` on a computed kind, are config mistakes and
// throw. A plain column only gets `userDefined` and `stateField` when it sets them; extract fields and formula readers are linked once every
// column is known (linkColumnKinds.js).
function normalizeColumnKind({ column, key }) {
  const { kind } = column;
  if (!type.isUndefined(kind) && type.isUndefined(COLUMN_KINDS[kind])) {
    fail(key, `has unknown kind "${kind}". Use one of: ${Object.keys(COLUMN_KINDS).join(', ')}.`);
  }
  checkKindKeys({ column, key, kind });
  if (!type.isUndefined(column.userDefined) && !type.isBoolean(column.userDefined)) {
    fail(
      key,
      `"userDefined" must be true or false. Received ${JSON.stringify(column.userDefined)}.`
    );
  }
  if (COMPUTED_KINDS.has(kind) && column.editable === true) {
    fail(key, `has kind "${kind}", which computes its value, so it cannot be editable.`);
  }
  const stateField = getStateField({ column, key, kind });
  if (type.isUndefined(kind)) {
    // Plain columns keep the leaf shape they always had, with only the keys they set.
    const plain = {};
    if (column.userDefined === true) plain.userDefined = true;
    if (!type.isUndefined(stateField)) plain.stateField = stateField;
    return plain;
  }
  const base = {
    kind,
    userDefined: column.userDefined === true,
    computed: COMPUTED_KINDS.has(kind),
    stateField,
  };
  switch (kind) {
    case 'formula':
      return { ...base, template: checkTemplate({ column, key, name: 'template' }) };
    case 'enrichment':
      return {
        ...base,
        field: `${stateField}.value`,
        provider: checkString({ column, key, name: 'provider', required: true }),
        inputs: checkInputs({ inputs: column.inputs, key }),
        output: checkString({ column, key, name: 'output', required: false }),
        autoRun: checkAutoRun({ column, key }),
      };
    case 'ai': {
      const output = checkOutputType({ output: column.output, key });
      return {
        ...base,
        field: `${stateField}.value`,
        type: output?.type,
        options: output?.options,
        provider: checkString({ column, key, name: 'provider', required: false }) ?? 'ai',
        prompt: checkTemplate({ column, key, name: 'prompt' }),
        inputs: checkInputs({ inputs: column.inputs, key }),
        output,
        autoRun: checkAutoRun({ column, key }),
      };
    }
    case 'extract':
      return {
        ...base,
        source: checkString({ column, key, name: 'source', required: true }),
        // `path` on a leaf is its header group path, so the extract path is `extractPath`.
        extractPath: checkString({ column, key, name: 'path', required: false }) ?? '',
      };
    default:
      return base;
  }
}

export default normalizeColumnKind;
