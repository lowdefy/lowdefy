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

import journeyTargetSelectors from './journeyTargetSelectors.js';
import parseElementsChain from './parseElementsChain.js';
import parseRowIndex from './parseRowIndex.js';
import type from './type.js';

const { blockWrapperPrefix, controlAttributes, gridRules, interactiveRoles, isGeneratedRowKey } =
  journeyTargetSelectors;

function blockIdOf(entry) {
  const id = entry.attributes.attr__id;
  if (!type.isString(id) || !id.startsWith(blockWrapperPrefix)) {
    return null;
  }
  return id.slice(blockWrapperPrefix.length);
}

function normaliseText(value) {
  if (!type.isString(value)) {
    return null;
  }
  const text = value.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

function isOption(entry) {
  return (
    entry.classes.includes('ant-select-item-option') || entry.attributes.attr__role === 'option'
  );
}

// The chain form of the interactive-control selector. A radio or checkbox input inside a label
// is reached through the label, as the selector does.
function isInteractive(entry, position, scope) {
  const { attributes, tag } = entry;
  if (interactiveRoles.includes(attributes.attr__role)) {
    return true;
  }
  if (tag === 'input') {
    if (attributes.attr__type === 'hidden') {
      return false;
    }
    const isToggle = attributes.attr__type === 'radio' || attributes.attr__type === 'checkbox';
    return !(isToggle && scope.slice(position + 1).some((outer) => outer.tag === 'label'));
  }
  if (tag === 'a') {
    return type.isString(attributes.href) || type.isString(attributes.attr__href);
  }
  return ['button', 'textarea', 'select', 'label'].includes(tag);
}

// The text of the control the click reached (an interactive control or a dropdown option): its
// own text, else (a label or option whose text sits in a child) the first text between the
// clicked element and it. posthog-js records the clicked element's direct text and the text of
// buttons, links and other form elements. A click that reached no control has no text, as in
// describeElement: its block alone targets it.
function textOf(scope) {
  const controlIndex = scope.findIndex(
    (entry, position) => isInteractive(entry, position, scope) || isOption(entry)
  );
  if (controlIndex === -1) {
    return null;
  }
  for (const entry of [scope[controlIndex], ...scope.slice(0, controlIndex)]) {
    const text = normaliseText(entry.attributes.text);
    if (text !== null) {
      return text;
    }
  }
  return null;
}

// The chain form of the grid part selector: the entry has the part's class and attribute, the
// part's role when it names one (a Table header cell has a body cell's class and column key, but
// the role `columnheader`), and is not the part's header (the Table header row's index -1).
function matchesGridPart({ entry, part }) {
  const value = entry.attributes[`attr__${part.attribute}`];
  if (!entry.classes.includes(part.className) || type.isNone(value)) return false;
  if (!type.isNone(part.role) && entry.attributes.attr__role !== part.role) return false;
  return type.isNone(part.header) || value !== part.header;
}

// The innermost row or cell entry of any grid, the row index or column key it carries and the
// rule it matched, else null.
function findGridPart({ entries, kind }) {
  for (const [index, entry] of entries.entries()) {
    const rule = gridRules.find((candidate) => matchesGridPart({ entry, part: candidate[kind] }));
    if (rule) {
      return { entry, index, rule, value: entry.attributes[`attr__${rule[kind].attribute}`] };
    }
  }
  return null;
}

function markOf({ entry, attribute }) {
  const value = entry.attributes[`attr__${attribute}`];
  return type.isString(value) && value !== '' ? value : null;
}

// The row's own key, by the grid rule the row matched, unless the grid generated it: a generated
// key changes between renders, so the row keeps its displayed index alone.
function rowKeyOf(row) {
  if (row === null) return null;
  const { entry, rule } = row;
  if (!matchesGridPart({ entry, part: rule.rowKey })) return null;
  const rowKey = markOf({ entry, attribute: rule.rowKey.attribute });
  return rowKey === null || isGeneratedRowKey(rowKey) ? null : rowKey;
}

// The innermost marked control the click passed through, as the block and key it is marked with,
// else null. A cell control in a row with a generated key is no control target: its key repeats
// in every row and the row has no key to tell them apart.
function findMarkedControl(entries) {
  const entry = entries.find(
    (candidate) =>
      markOf({ entry: candidate, attribute: controlAttributes.blockId }) !== null &&
      markOf({ entry: candidate, attribute: controlAttributes.control }) !== null
  );
  if (type.isUndefined(entry)) return null;
  const rowKey = markOf({ entry, attribute: controlAttributes.rowKey });
  if (rowKey !== null && isGeneratedRowKey(rowKey)) return null;
  return {
    blockId: markOf({ entry, attribute: controlAttributes.blockId }),
    control: markOf({ entry, attribute: controlAttributes.control }),
    rowKey,
  };
}

// The journey target a posthog-js `$elements_chain` describes, read by the rules describeElement
// reads a DOM element by: the block wrappers the click passed through (innermost first), the grid
// row, its key and the column, the control's text, and whether it was a dropdown option.
//
// A click inside a marked control (data-lf-block, data-lf-control) describes as that block's
// control, with its row key when it sits in a keyed row and the column of its cell: no text or
// nth, and the control's block leads block_ids, since a popup control sits in no block wrapper. A
// row with a key the grid did not generate gives `row_key` beside `row`; the journey compiler
// writes rowKey in place of row. With `marks: false` the marks are not read, so a control
// describes by its text as before: the PostHog enrichment sends that, and no row key.
//
// Pure, so the production pull runs it in Node on captured events. Total: any string gives a
// target and never throws.
function targetFromElementsChain(chain, { marks = true } = {}) {
  const entries = type.isString(chain) ? parseElementsChain(chain) : [];
  const blockIds = entries.map(blockIdOf).filter((blockId) => blockId !== null);
  const blockIndex = entries.findIndex((entry) => blockIdOf(entry) !== null);
  const inner = blockIndex === -1 ? entries : entries.slice(0, blockIndex);
  const scope = blockIndex === -1 ? entries : entries.slice(0, blockIndex + 1);
  const row = findGridPart({ entries: inner, kind: 'row' });
  // A cell counts only inside a row: a Table summary row's cells sit in a row with no index.
  const cell =
    row === null ? null : findGridPart({ entries: inner.slice(0, row.index), kind: 'cell' });
  const target = {
    block_id: blockIds[0] ?? null,
    row: row === null ? null : parseRowIndex(row.value),
    row_key: null,
    column: cell === null ? null : cell.value,
    control: null,
    text: textOf(scope),
    option: inner.some(isOption),
    block_ids: blockIds,
  };
  if (!marks) {
    const { row_key: _rowKey, control: _control, ...unmarked } = target;
    return unmarked;
  }
  // The key of a pinned row (ag-grid `t-0`) names no journey row, as its index does not.
  if (target.row !== null) target.row_key = rowKeyOf(row);
  const marked = findMarkedControl(entries);
  if (marked === null) return target;
  return {
    ...target,
    block_id: marked.blockId,
    row_key: marked.rowKey,
    control: marked.control,
    text: null,
    option: false,
    block_ids: [marked.blockId, ...blockIds.filter((blockId) => blockId !== marked.blockId)],
  };
}

export default targetFromElementsChain;
