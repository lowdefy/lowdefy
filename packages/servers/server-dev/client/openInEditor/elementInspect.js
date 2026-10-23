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

// Pure DOM-reading helpers for open-in-editor's block resolution.
// Blocks render as id="bl-{blockId}" (skeletons use "s-bl-" and must NOT
// match — the "^=" prefix selector already excludes them since "s-bl-..."
// starts with "s-", not "bl-").

const BLOCK_ID_PREFIX = 'bl-';
const BLOCK_SELECTOR = `[id^="${BLOCK_ID_PREFIX}"]`;
const DEV_TOOLS_ROOT_SELECTOR = '[data-lowdefy-dev-tools]';

function isInsideDevTools(el) {
  if (!(el instanceof Element)) {
    return false;
  }
  return Boolean(el.closest(DEV_TOOLS_ROOT_SELECTOR));
}

function stripBlockId(blockEl) {
  return blockEl.id.slice(BLOCK_ID_PREFIX.length);
}

// Nearest ancestor block element (or the element itself), ignoring the dev
// tools' own DOM so pointing at the highlight never resolves to an app block.
function nearestBlock(el) {
  if (!(el instanceof Element) || isInsideDevTools(el)) {
    return null;
  }
  const blockEl = el.closest(BLOCK_SELECTOR);
  if (!blockEl) {
    return null;
  }
  return stripBlockId(blockEl);
}

// All bl- ancestors, nearest to outermost, prefix stripped.
function blockAncestorChain(el) {
  if (!(el instanceof Element) || isInsideDevTools(el)) {
    return [];
  }
  const chain = [];
  let current = el.closest(BLOCK_SELECTOR);
  while (current) {
    chain.push(stripBlockId(current));
    current = current.parentElement ? current.parentElement.closest(BLOCK_SELECTOR) : null;
  }
  return chain;
}

export { nearestBlock, blockAncestorChain };
