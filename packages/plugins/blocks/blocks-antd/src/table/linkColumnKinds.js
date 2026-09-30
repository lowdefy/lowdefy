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

import { get, type } from '@lowdefy/helpers';

import createFormulaReader from './createFormulaReader.js';
import findTemplateRefs from './findTemplateRefs.js';
import invalidateColumn from './invalidateColumn.js';
import isEnrichmentInputColumn from './isEnrichmentInputColumn.js';
import readColumnValue from './readColumnValue.js';

const RUN_KINDS = new Set(['enrichment', 'ai']);

function reader(column) {
  return (row) => readColumnValue({ column, row });
}

// An input from an enrichment or ai column is that cell's result, and only once it is `ok`
// (the server's rule: a cell still running upstream has no input yet).
function inputReader(column) {
  if (!RUN_KINDS.has(column.kind)) return reader(column);
  return (row) => {
    const state = get(row, column.stateField);
    return state?.status === 'ok' ? state.value : undefined;
  };
}

// Columns a template references by key whose value is not the row field of the same name.
function templateRefs({ template, column, columnsByKey }) {
  return findTemplateRefs(template)
    .map((ref) => columnsByKey[ref])
    .filter((ref) => ref && ref !== column && (ref.kind === 'formula' || ref.field !== ref.key));
}

// A cycle through a user-defined formula makes its user-defined formulas error columns; a
// cycle of declared formulas throws.
function checkFormulaCycles({ leaves, columnsByKey }) {
  const state = new Map();
  function visit(column, trail) {
    if (state.get(column.key) === 'done') return;
    if (state.get(column.key) === 'visiting') {
      const keys = [...trail.slice(trail.indexOf(column.key)), column.key];
      const reason = `Table formula columns ${keys
        .map((key) => `"${key}"`)
        .join(' -> ')} reference each other.`;
      const users = keys.map((key) => columnsByKey[key]).filter((ref) => ref.userDefined);
      if (users.length === 0) throw new Error(reason);
      users.forEach((ref) => invalidateColumn({ column: ref, reason }));
      return;
    }
    state.set(column.key, 'visiting');
    templateRefs({ template: column.template, column, columnsByKey })
      .filter((ref) => ref.kind === 'formula')
      .forEach((ref) => {
        if (column.invalid === undefined) visit(ref, [...trail, column.key]);
      });
    state.set(column.key, 'done');
  }
  leaves.filter((leaf) => leaf.kind === 'formula').forEach((leaf) => visit(leaf, []));
}

function linkEnrichmentInputs({ column, columnsByKey }) {
  return Object.entries(column.inputs).map(([param, source]) => {
    if (!type.isString(source.column)) return { param, value: source.value };
    const ref = columnsByKey[source.column];
    if (!ref) {
      throw new Error(
        `Table column "${column.key}" input "${param}" names unknown column "${source.column}".`
      );
    }
    if (!isEnrichmentInputColumn(ref)) {
      throw new Error(
        `Table column "${column.key}" input "${param}" reads column "${source.column}", which the server can not read (formula and extract columns compute in the browser). An input reads an input or data column, or an enrichment or ai column.`
      );
    }
    return { param, read: inputReader(ref) };
  });
}

function linkExtract({ column, columnsByKey, explicitField }) {
  const source = columnsByKey[column.source];
  if (!source || !RUN_KINDS.has(source.kind)) {
    throw new Error(
      `Table column "${column.key}" extracts from "${column.source}", which is not an enrichment or ai column.`
    );
  }
  if (explicitField) return;
  column.field =
    column.extractPath === ''
      ? `${source.stateField}.raw`
      : `${source.stateField}.raw.${column.extractPath}`;
}

function linkColumn({ column, columnsByKey, fieldKeys }) {
  switch (column.kind) {
    case 'extract':
      linkExtract({ column, columnsByKey, explicitField: fieldKeys.has(column.key) });
      break;
    case 'formula':
      column.read = createFormulaReader({
        template: column.template,
        refs: templateRefs({ template: column.template, column, columnsByKey }).map((ref) => ({
          key: ref.key,
          read: reader(ref),
        })),
      });
      break;
    case 'enrichment':
    case 'ai':
      column.inputSources = linkEnrichmentInputs({ column, columnsByKey });
      break;
    default:
      break;
  }
}

// A user-defined column whose links fail (an input or source column that is gone, a formula
// template that does not compile) becomes an error column instead of taking the table down.
function linkUserColumn({ column, columnsByKey, fieldKeys }) {
  try {
    linkColumn({ column, columnsByKey, fieldKeys });
  } catch (error) {
    invalidateColumn({ column, reason: error.message });
  }
}

// The second pass over the leaves of normalizeColumns, once every key is known: extract columns
// get their field (`<source state>.raw.<path>`), formula columns their value reader (`read`,
// references resolved to columns, cycles rejected), and enrichment and ai columns the sources of
// their `inputs` (`inputSources: [{ param, read } | { param, value }]`, readers rather than column
// objects, so a column never holds another; an enrichment or ai column's value is only an input
// once its status is `ok`). `fieldKeys` are the columns whose config set
// `field` themselves. A user-defined column whose links fail becomes an error column. Mutates
// the leaves.
function linkColumnKinds({ leaves, columnsByKey, fieldKeys }) {
  checkFormulaCycles({ leaves, columnsByKey });
  leaves.forEach((column) => {
    if (column.userDefined === true) linkUserColumn({ column, columnsByKey, fieldKeys });
    else linkColumn({ column, columnsByKey, fieldKeys });
  });
}

export default linkColumnKinds;
