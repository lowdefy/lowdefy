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

import { findInteractiveControls, journeyTargetSelectors, type } from '@lowdefy/helpers';

const { blockWrapperPrefix, controlSelector, gridSelector, isGeneratedRowKey, layers } =
  journeyTargetSelectors;

// The cell a row-key target with no column or control clicks: the row's first cell. AG Grid draws
// cells out of display order, so it is the cell AG Grid and Table number first, not the first
// cell element.
const FIRST_CELL = '[aria-colindex="1"]';

function textOf(element) {
  return element.textContent.replace(/\s+/g, ' ').trim();
}

function controlsIn(roots) {
  return roots.flatMap((root) => findInteractiveControls(root));
}

function controlsWithText(roots, text) {
  return controlsIn(roots).filter((control) => textOf(control) === text);
}

// Whether the DOM says an element is hidden: it or an ancestor carries `hidden` or an inline
// `display: none` or `visibility: hidden` (antd hides a closed modal or popup this way). Layout is
// unknown here, so anything else counts as visible.
function isHiddenInDom(element) {
  for (let current = element; current !== null; current = current.parentElement) {
    if (current.hidden) return true;
    const { style } = current;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
  }
  return false;
}

// The rows of the block with the target's row key, or none when the grid generated the key (a
// generated key changes between renders) or when several rows carry it, as the runner refuses
// both. A row AG Grid splits across pinned containers holds its first cell once, so the rows
// with a first cell count the rows.
function rowsByKey({ roots, rowKey }) {
  if (isGeneratedRowKey(rowKey)) return [];
  const rows = roots.flatMap((root) => [
    ...root.querySelectorAll(gridSelector({ kind: 'rowKey', value: rowKey })),
  ]);
  return rows.filter((row) => row.querySelector(FIRST_CELL) !== null).length > 1 ? [] : rows;
}

// The roots the target's scope keys name: the block wrapper, narrowed to every grid row with the
// row key, else the row index (before AG Grid 36 a row was rendered once per pinned and centre
// container), and to the cells with the column id inside them. Null for a page-wide target. A
// describe-form target carries `row` beside `row_key`; the key names the row.
function resolveScope({ document, target }) {
  if (type.isNone(target.block_id)) {
    return null;
  }
  const wrapper = document.getElementById(`${blockWrapperPrefix}${target.block_id}`);
  let roots = wrapper ? [wrapper] : [];
  if (!type.isNone(target.row_key)) {
    roots = rowsByKey({ roots, rowKey: target.row_key });
  } else if (!type.isNone(target.row)) {
    roots = roots.flatMap((root) => [
      ...root.querySelectorAll(gridSelector({ kind: 'row', value: target.row })),
    ]);
  }
  if (!type.isNone(target.column)) {
    roots = roots.flatMap((root) => [
      ...root.querySelectorAll(gridSelector({ kind: 'cell', value: target.column })),
    ]);
  }
  return roots;
}

// The match a text target names: the nth, or with no nth the only one. The runner fails an
// action whose text matches several controls and gives no nth, so that resolves to nothing.
function pickMatch({ matches, nth }) {
  if (type.isNone(nth)) {
    return matches.length === 1 ? matches[0] : null;
  }
  return matches[nth] ?? null;
}

// The front-most open layer that holds a control with the text, else the page.
function resolvePageWideText({ document, target }) {
  for (const layer of layers) {
    const open = [...document.querySelectorAll(layer)];
    if (open.length > 0) {
      const root = open[open.length - 1];
      if (controlsWithText([root], target.text).length > 0) {
        return pickMatch({ matches: controlsWithText([root], target.text), nth: target.nth });
      }
    }
  }
  return pickMatch({ matches: controlsWithText([document], target.text), nth: target.nth });
}

// A control target: the one visible element marked with the block, the key and the row key,
// anywhere in the document (antd draws popups and modal footers outside the block), inside a
// cell of the column when one is given. Null when none or several match: the runner opens a
// closed dropdown first, which a static DOM cannot, and refuses several matches.
function resolveControl({ document, target }) {
  if (type.isNone(target.block_id)) return null;
  if (!type.isNone(target.row_key) && isGeneratedRowKey(target.row_key)) return null;
  let matches = [
    ...document.querySelectorAll(
      controlSelector({
        blockId: target.block_id,
        control: target.control,
        rowKey: target.row_key ?? undefined,
      })
    ),
  ].filter((element) => !isHiddenInDom(element));
  if (!type.isNone(target.column)) {
    const cell = gridSelector({ kind: 'cell', value: target.column });
    matches = matches.filter((element) => element.closest(cell) !== null);
  }
  return matches.length === 1 ? matches[0] : null;
}

// The element a journey `click` step acts on for a target in describe form
// ({ block_id, row, row_key, column, control, text, nth }; null or missing keys are absent),
// resolved in a DOM without layout (jsdom) step for step as the journey runner resolves it with
// Playwright: visibility is assumed unless the DOM itself hides an element. A target that names a
// control (`control`, `text`, `nth`) resolves to it; a target that names a container (block, row,
// cell) resolves to its first control, or to itself when it has none, except a row by key, which
// resolves to its first cell. Null when nothing matches, or when a text with no nth or a control
// matches several elements.
function resolveTargetInDocument({ document, target }) {
  if (!type.isNone(target.control)) {
    return resolveControl({ document, target });
  }
  const scope = resolveScope({ document, target });
  if (!type.isNone(target.text)) {
    if (scope === null) {
      return resolvePageWideText({ document, target });
    }
    return pickMatch({ matches: controlsWithText(scope, target.text), nth: target.nth });
  }
  if (scope === null) {
    return null;
  }
  if (!type.isNone(target.nth)) {
    return controlsIn(scope)[target.nth] ?? null;
  }
  if (!type.isNone(target.row_key) && type.isNone(target.column)) {
    return scope.map((row) => row.querySelector(FIRST_CELL)).find((cell) => cell !== null) ?? null;
  }
  return controlsIn(scope)[0] ?? scope[0] ?? null;
}

export default resolveTargetInDocument;
