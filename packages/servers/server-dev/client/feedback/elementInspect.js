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

// Pure DOM-reading helpers for the feedback overlay's "pick a block" mode.
// Blocks render as id="bl-{blockId}" (skeletons use "s-bl-" and must NOT
// match — the "^=" prefix selector already excludes them since "s-bl-..."
// starts with "s-", not "bl-").

const BLOCK_ID_PREFIX = 'bl-';
const BLOCK_SELECTOR = `[id^="${BLOCK_ID_PREFIX}"]`;
const FEEDBACK_ROOT_SELECTOR = '[data-lowdefy-feedback]';
const MAX_TEXT_LENGTH = 120;
const MAX_CLASS_LENGTH = 200;

function isInsideFeedbackOverlay(el) {
  if (!(el instanceof Element)) {
    return false;
  }
  return Boolean(el.closest(FEEDBACK_ROOT_SELECTOR));
}

function stripBlockId(blockEl) {
  return blockEl.id.slice(BLOCK_ID_PREFIX.length);
}

// Nearest ancestor block element (or the element itself), ignoring the
// feedback overlay's own DOM so pointing at the overlay never resolves to an
// app block.
function nearestBlock(el) {
  if (!(el instanceof Element) || isInsideFeedbackOverlay(el)) {
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
  if (!(el instanceof Element) || isInsideFeedbackOverlay(el)) {
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

function describeElement(el) {
  if (!(el instanceof Element)) {
    return { tag: null, classes: null, text: null };
  }

  let classes = null;
  try {
    classes = typeof el.className === 'string' ? el.className : null;
  } catch {
    classes = null;
  }
  if (classes && classes.length > MAX_CLASS_LENGTH) {
    classes = `${classes.slice(0, MAX_CLASS_LENGTH)}…`;
  }

  let text = '';
  try {
    text = el.textContent ? el.textContent.trim() : '';
  } catch {
    text = '';
  }
  if (text.length > MAX_TEXT_LENGTH) {
    text = `${text.slice(0, MAX_TEXT_LENGTH)}…`;
  }

  return {
    tag: el.tagName ?? null,
    classes,
    text: text || null,
  };
}

export { nearestBlock, blockAncestorChain, describeElement };
