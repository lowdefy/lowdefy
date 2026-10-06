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

const { blockWrapperPrefix, cellAttribute, dropdownOption, layers, rowAttribute } =
  journeyTargetSelectors;

function textOf(element) {
  const text = element.textContent.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
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
function pageWideRoot({ document, text }) {
  if (text === null) {
    return document;
  }
  for (const layer of layers) {
    const open = [...document.querySelectorAll(layer)].filter(isElementVisible);
    if (open.length > 0) {
      const root = open[open.length - 1];
      if (controlsWithText(root, text).length > 0) {
        return root;
      }
    }
  }
  return document;
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
// block alone targets it.
function createDescribeElement({ findBlockType, pathEntryOf }) {
  return function describeElement(element) {
    const document = element.ownerDocument;
    const path = ancestorsOf(element);
    const wrappers = path.filter((node) => node.id.startsWith(blockWrapperPrefix));
    const blockIds = wrappers.map((node) => node.id.slice(blockWrapperPrefix.length));
    const wrapper = wrappers[0] ?? null;
    const inner = wrapper === null ? path : path.slice(0, path.indexOf(wrapper));
    const rowElement = inner.find((node) => node.matches(`.ag-row[${rowAttribute}]`)) ?? null;
    const cellElement = inner.find((node) => node.matches(`.ag-cell[${cellAttribute}]`)) ?? null;
    const scope = cellElement ?? rowElement ?? wrapper;
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
        : nthOf({ control, root: scope ?? pageWideRoot({ document, text }), text });
    const entry = pathEntryOf(document.location.href);
    const blockId = blockIds[0] ?? null;
    return {
      page_id: entry?.pageId ?? null,
      block_id: blockId,
      block_type: findBlockType({ blockId, instanceKey: entry?.instanceKey }),
      row: rowElement === null ? null : parseRowIndex(rowElement.getAttribute(rowAttribute)),
      column: cellElement === null ? null : cellElement.getAttribute(cellAttribute),
      text,
      nth,
      option: optionElement !== null,
      block_ids: blockIds,
    };
  };
}

export default createDescribeElement;
