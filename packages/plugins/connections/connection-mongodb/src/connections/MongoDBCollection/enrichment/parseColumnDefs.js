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

import isColumnKey from './isColumnKey.js';

const kinds = ['input', 'formula', 'enrichment', 'ai', 'extract'];
const runnableKinds = ['enrichment', 'ai'];
const PROVIDER_ID = /^[A-Za-z0-9_-]{1,64}$/;
const maxColumnDefs = 500;
const maxInputs = 50;
const maxPromptLength = 20000;

function invalid({ requestType, message, received }) {
  return new Error(`${requestType} "columnDefs" ${message} Received ${JSON.stringify(received)}.`);
}

function parseInput({ param, input, key, requestType }) {
  if (!isColumnKey(param)) {
    throw invalid({
      requestType,
      message: `column "${key}" has an input name that is not a plain key (letters, digits, "_" and "-").`,
      received: param,
    });
  }
  if (!type.isObject(input)) {
    throw invalid({
      requestType,
      message: `column "${key}" input "${param}" should be { column } or { value }.`,
      received: input,
    });
  }
  const inputKeys = Object.keys(input);
  if (inputKeys.length === 1 && inputKeys[0] === 'value') {
    return { param, value: input.value };
  }
  const isColumnInput =
    type.isString(input.column) &&
    input.column !== '' &&
    inputKeys.every((inputKey) => inputKey === 'column' || inputKey === 'required') &&
    (type.isNone(input.required) || type.isBoolean(input.required));
  if (!isColumnInput) {
    throw invalid({
      requestType,
      message: `column "${key}" input "${param}" should be { column, required? } or { value }.`,
      received: input,
    });
  }
  if (input.column === key) {
    throw invalid({
      requestType,
      message: `column "${key}" input "${param}" reads the column itself.`,
      received: input,
    });
  }
  return { param, column: input.column, required: input.required !== false };
}

function parseInputs({ inputs, key, requestType }) {
  if (type.isNone(inputs)) return [];
  if (!type.isObject(inputs)) {
    throw invalid({
      requestType,
      message: `column "${key}" "inputs" should be an object of { column } or { value } inputs.`,
      received: inputs,
    });
  }
  const entries = Object.entries(inputs);
  if (entries.length > maxInputs) {
    throw invalid({
      requestType,
      message: `column "${key}" has ${entries.length} inputs, more than ${maxInputs}.`,
      received: Object.keys(inputs),
    });
  }
  return entries.map(([param, input]) => parseInput({ param, input, key, requestType }));
}

function parseRunnable({ columnDef, requestType }) {
  const { key, kind } = columnDef;
  if (!isColumnKey(key)) {
    throw invalid({
      requestType,
      message: `${kind} column key should be 1 to 128 letters, digits, "_" or "-", since it is a path segment under "_enrich".`,
      received: key,
    });
  }
  const provider = columnDef.provider ?? (kind === 'ai' ? 'ai' : undefined);
  if (!type.isString(provider) || !PROVIDER_ID.test(provider)) {
    throw invalid({
      requestType,
      message: `column "${key}" should have a "provider" id of letters, digits, "_" or "-".`,
      received: columnDef.provider,
    });
  }
  if (
    !type.isNone(columnDef.prompt) &&
    (!type.isString(columnDef.prompt) || columnDef.prompt.length > maxPromptLength)
  ) {
    throw invalid({
      requestType,
      message: `column "${key}" "prompt" should be a string of at most ${maxPromptLength} characters.`,
      received: columnDef.prompt,
    });
  }
  if (!type.isNone(columnDef.autoRun) && !type.isBoolean(columnDef.autoRun)) {
    throw invalid({
      requestType,
      message: `column "${key}" "autoRun" should be a boolean.`,
      received: columnDef.autoRun,
    });
  }
  return {
    key,
    kind,
    runnable: true,
    provider,
    prompt: columnDef.prompt ?? null,
    autoRun: columnDef.autoRun === true,
    inputs: parseInputs({ inputs: columnDef.inputs, key, requestType }),
  };
}

function parseColumnDef({ columnDef, requestType }) {
  if (!type.isObject(columnDef) || !type.isString(columnDef.key) || columnDef.key === '') {
    throw invalid({
      requestType,
      message: 'should be an array of columns with a string "key".',
      received: columnDef,
    });
  }
  if (!type.isNone(columnDef.kind) && !kinds.includes(columnDef.kind)) {
    throw invalid({
      requestType,
      message: `column "${columnDef.key}" "kind" should be one of ${JSON.stringify(kinds)}.`,
      received: columnDef.kind,
    });
  }
  if (runnableKinds.includes(columnDef.kind)) return parseRunnable({ columnDef, requestType });
  return { key: columnDef.key, kind: columnDef.kind ?? null, runnable: false };
}

// An autoRun chain that comes back to a column would enqueue its columns forever, each run
// spending provider calls, so a cycle between enrichment columns is refused.
function assertNoCycles({ columnDefsByKey, requestType }) {
  const done = new Set();
  function visit(key, path) {
    if (path.includes(key)) {
      throw new Error(
        `${requestType} "columnDefs" has an input cycle: ${[...path, key].join(' -> ')}.`
      );
    }
    if (done.has(key)) return;
    const columnDef = columnDefsByKey.get(key);
    columnDef.inputs.forEach((input) => {
      const upstream = columnDefsByKey.get(input.column);
      if (upstream?.runnable === true) visit(upstream.key, [...path, key]);
    });
    done.add(key);
  }
  columnDefsByKey.forEach((columnDef) => {
    if (columnDef.runnable) visit(columnDef.key, []);
  });
}

// The table's columns, as the app passes them: declared and user-defined columns merged (a
// Table columns list may be passed as it is, other column settings are ignored). Enrichment
// and ai columns are validated in full: their key is a path segment under `_enrich`, and their
// inputs are { column } references or literal { value }s. A Map, so a key such as
// "__proto__" never resolves to a column.
function parseColumnDefs({ columnDefs, requestType }) {
  if (!type.isArray(columnDefs) || columnDefs.length === 0) {
    throw invalid({
      requestType,
      message: 'should be a non-empty array of the table columns.',
      received: columnDefs,
    });
  }
  if (columnDefs.length > maxColumnDefs) {
    throw invalid({
      requestType,
      message: `has ${columnDefs.length} columns, more than ${maxColumnDefs}.`,
      received: columnDefs.length,
    });
  }
  const columnDefsByKey = new Map();
  columnDefs.forEach((columnDef) => {
    const parsed = parseColumnDef({ columnDef, requestType });
    if (columnDefsByKey.has(parsed.key)) {
      throw invalid({ requestType, message: 'has a duplicate column key.', received: parsed.key });
    }
    columnDefsByKey.set(parsed.key, parsed);
  });
  assertNoCycles({ columnDefsByKey, requestType });
  return columnDefsByKey;
}

export default parseColumnDefs;
