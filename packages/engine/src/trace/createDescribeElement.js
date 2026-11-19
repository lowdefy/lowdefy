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

import {
  findInteractiveControls,
  isInteractiveControl,
  journeyTargetSelectors,
  parseRowIndex,
} from '@lowdefy/helpers';

import isElementVisible from './isElementVisible.js';

const {
  blockWrapperPrefix,
  controlAttributes,
  dropdownOption,
  gridPartSelector,
  gridRules,
  gridSelector,
  isGeneratedRowKey,
  layers,
} = journeyTargetSelectors;

// Each grid's row and cell selectors, built once: describeElement runs on every traced click. A
// row also carries its rule's row-key part, read off the same element.
const gridParts = {
  row: gridRules.map(({ row, rowKey }) => ({
    attribute: row.attribute,
    selector: gridPartSelector({ part: row }),
    keyAttribute: rowKey.attribute,
    keySelector: gridPartSelector({ part: rowKey }),
  })),
  cell: gridRules.map(({ cell }) => ({
    attribute: cell.attribute,
    selector: gridPartSelector({ part: cell }),
  })),
};

function textOf(element) {
  const text = element.textContent.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

// The innermost row or cell element of any grid among the nodes and the row index or column key
// it carries, else null.
function findGridPart({ kind, nodes }) {
  for (const node of nodes) {
    const part = gridParts[kind].find((candidate) => node.matches(candidate.selector));
    if (part) {
      return { node, part, value: node.getAttribute(part.attribute) };
    }
  }
  return null;
}

// The displayed index a grid row element carries, by the rule of the grid it belongs to.
function rowIndexOf(node) {
  const part = gridParts.row.find((candidate) => node.matches(candidate.selector));
  return part ? node.getAttribute(part.attribute) : null;
}

// Whether a row key names one journey row among the grid rows in root, as every journey reader
// requires: the grid did not generate it (a generated key changes between renders), it keys no
// pinned row (ag-grid keys a pinned row by its position, `t-0`, and gives it no journey index),
// and no other row carries it. AG Grid draws a row once per pinned and centre container, each with
// the row's index, so rows are told apart by index. A key no drawn row carries is taken as it is.
function namesOneRow({ root, rowKey }) {
  if (isGeneratedRowKey(rowKey)) return false;
  const rows = root.querySelectorAll(gridSelector({ kind: 'rowKey', value: rowKey }));
  const indexes = new Set([...rows].map(rowIndexOf));
  if (indexes.size > 1) return false;
  return [...indexes].every((index) => parseRowIndex(index) !== null);
}

// The row's own key, unless it names no single journey row: the row then keeps its displayed
// index alone.
function rowKeyOf({ row, root }) {
  if (row === null || !row.node.matches(row.part.keySelector)) return null;
  const rowKey = row.node.getAttribute(row.part.keyAttribute);
  return rowKey === '' || !namesOneRow({ root, rowKey }) ? null : rowKey;
}

const markedControlSelector = `[${controlAttributes.blockId}]:not([${controlAttributes.blockId}=""])[${controlAttributes.control}]:not([${controlAttributes.control}=""])`;

// The innermost marked control the element sits in, as the block and key it is marked with, else
// null. A cell control whose row key names no single journey row of its block (generated, a
// pinned row's, or carried by several rows) is no control target: its key repeats from row to row
// and nothing tells its row apart, so the click describes by its row and text instead. The row is
// looked up in the block, since a cell's menu draws its items in a popup outside the row.
function findMarkedControl(element) {
  const node = element.closest(markedControlSelector);
  if (node === null) return null;
  const blockId = node.getAttribute(controlAttributes.blockId);
  const rowKey = node.getAttribute(controlAttributes.rowKey);
  if (rowKey !== null && rowKey !== '') {
    const { ownerDocument } = element;
    const root = ownerDocument.getElementById(`${blockWrapperPrefix}${blockId}`) ?? ownerDocument;
    if (!namesOneRow({ root, rowKey })) return null;
  }
  return {
    blockId,
    control: node.getAttribute(controlAttributes.control),
    rowKey: rowKey === '' ? null : rowKey,
  };
}

function ancestorsOf(element) {
  const path = [];
  for (let current = element; current !== null; current = current.parentElement) {
    path.push(current);
  }
  return path;
}

function controlsWithText(root, text) {
  return findInteractiveControls(root).filter(
    (control) => textOf(control) === text && isElementVisible(control)
  );
}

// With no block, a control is found by text in the front-most open layer that holds one with
// that text, else on the page, as the journey runner resolves a page-wide text target.
function pageWideRoot({ ownerDocument, text }) {
  if (text === null) {
    return ownerDocument;
  }
  for (const layer of layers) {
    const open = [...ownerDocument.querySelectorAll(layer)].filter(isElementVisible);
    if (open.length > 0) {
      const root = open[open.length - 1];
      if (controlsWithText(root, text).length > 0) {
        return root;
      }
    }
  }
  return ownerDocument;
}

// The control's index among the controls the runner would match in the scope: those with the
// same text, or with no text, every control. Null only for a unique match: the runner refuses to
// act on the first of several when no nth names it, so a recorded target always says which one
// it means, 0 included.
function nthOf({ control, root, text }) {
  const matches = text === null ? findInteractiveControls(root) : controlsWithText(root, text);
  const index = matches.indexOf(control);
  if (index < 0 || matches.length < 2) {
    return null;
  }
  return index;
}

// The journey target an element describes as: the journey runner's resolution in reverse, read
// by the same rules (journeyTargetSelectors), in canonical form. The control is the nearest
// interactive control inside the scope (cell, row, block, else page); a dropdown option stands
// in for one and folds into a select step. An element that reached no control has no text: its
// block alone targets it. It reads the element and the element's own document, never a global.
//
// An element inside a marked control (data-lf-block, data-lf-control) describes as that block's
// control, with its row key when it sits in a keyed row and the column of its cell: no text or
// nth, and the control's block leads block_ids, since a popup control sits in no block wrapper. A
// row whose key names one journey row gives `row_key` beside `row`; the journey compiler
// writes rowKey in place of row, and fill and select keep row. targetFromElementsChain reads a
// posthog-js chain by the same rules.
function createDescribeElement({ findBlockType, pathEntryOf }) {
  return function describeElement(element) {
    const { ownerDocument } = element;
    const path = ancestorsOf(element);
    const wrappers = path.filter((node) => node.id.startsWith(blockWrapperPrefix));
    const blockIds = wrappers.map((node) => node.id.slice(blockWrapperPrefix.length));
    const wrapper = wrappers[0] ?? null;
    const inner = wrapper === null ? path : path.slice(0, path.indexOf(wrapper));
    const row = findGridPart({ kind: 'row', nodes: inner });
    // A cell counts only inside a row: a Table summary row's cells sit in a row with no index.
    const cell =
      row === null
        ? null
        : findGridPart({ kind: 'cell', nodes: inner.slice(0, inner.indexOf(row.node)) });
    const scope = cell?.node ?? row?.node ?? wrapper;
    const scopePath = scope === null ? path : path.slice(0, path.indexOf(scope) + 1);
    const control = scopePath.find(isInteractiveControl) ?? null;
    const optionElement = element.closest(dropdownOption);
    let text = null;
    if (control !== null) {
      text = textOf(control);
    } else if (optionElement !== null) {
      text = textOf(optionElement);
    }
    const nth =
      control === null
        ? null
        : nthOf({ control, root: scope ?? pageWideRoot({ ownerDocument, text }), text });
    const entry = pathEntryOf(ownerDocument.location.href);
    const rowIndex = row === null ? null : parseRowIndex(row.value);
    // The key of a pinned row (ag-grid `t-0`) names no journey row, as its index does not.
    const rowKey = rowIndex === null ? null : rowKeyOf({ row, root: wrapper ?? ownerDocument });
    const marked = findMarkedControl(element);
    if (marked !== null) {
      return {
        page_id: entry?.pageId ?? null,
        block_id: marked.blockId,
        block_type: findBlockType({ blockId: marked.blockId, instanceKey: entry?.instanceKey }),
        row: rowIndex,
        row_key: marked.rowKey,
        column: cell === null ? null : cell.value,
        control: marked.control,
        text: null,
        nth: null,
        option: false,
        block_ids: [marked.blockId, ...blockIds.filter((id) => id !== marked.blockId)],
      };
    }
    const blockId = blockIds[0] ?? null;
    return {
      page_id: entry?.pageId ?? null,
      block_id: blockId,
      block_type: findBlockType({ blockId, instanceKey: entry?.instanceKey }),
      row: rowIndex,
      row_key: rowKey,
      column: cell === null ? null : cell.value,
      control: null,
      text,
      nth,
      option: optionElement !== null,
      block_ids: blockIds,
    };
  };
}

export default createDescribeElement;
