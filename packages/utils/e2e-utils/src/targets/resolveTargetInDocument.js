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

const { blockWrapperPrefix, cellAttribute, layers, rowAttribute } = journeyTargetSelectors;

function textOf(element) {
  return element.textContent.replace(/\s+/g, ' ').trim();
}

function controlsIn(roots) {
  return roots.flatMap((root) => findInteractiveControls(root));
}

function controlsWithText(roots, text) {
  return controlsIn(roots).filter((control) => textOf(control) === text);
}

function attributeSelector(value) {
  return `"${String(value).replace(/["\\]/g, '\\$&')}"`;
}

// The roots the target's scope keys name: the block wrapper, narrowed to every grid row with the
// row index (ag-grid renders a row once per pinned and centre container) and to the cells with
// the column id inside them. Null for a page-wide target.
function resolveScope({ document, target }) {
  if (type.isNone(target.block_id)) {
    return null;
  }
  const wrapper = document.getElementById(`${blockWrapperPrefix}${target.block_id}`);
  let roots = wrapper ? [wrapper] : [];
  if (!type.isNone(target.row)) {
    roots = roots.flatMap((root) => [
      ...root.querySelectorAll(`.ag-row[${rowAttribute}=${attributeSelector(target.row)}]`),
    ]);
  }
  if (!type.isNone(target.column)) {
    roots = roots.flatMap((root) => [
      ...root.querySelectorAll(`.ag-cell[${cellAttribute}=${attributeSelector(target.column)}]`),
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

// The element a journey `click` step acts on for a target in describe form
// ({ block_id, row, column, text, nth }; null or missing keys are absent), resolved in a DOM
// without layout (jsdom) step for step as the journey runner resolves it with Playwright:
// visibility is assumed. A target that names a control (`text`, `nth`) resolves to it; a target
// that names a container (block, row, cell) resolves to its first control, or to itself when it
// has none. Null when nothing matches, or when a text with no nth matches several controls.
function resolveTargetInDocument({ document, target }) {
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
  return controlsIn(scope)[0] ?? scope[0] ?? null;
}

export default resolveTargetInDocument;
