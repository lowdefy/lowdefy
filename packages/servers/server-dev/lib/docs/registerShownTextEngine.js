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

import { SHOWN_TEXT_ENGINE } from './shownTextSelector.js';

// The selector engine a `containing` target is found by: the innermost
// elements whose shown text contains the string. Playwright's getByText reads
// an element's text nodes joined with nothing between them, so a label and
// value that only layout separates (`<span>Assigned to</span><b>Jane</b>` in a
// flex row, table cells, block children) read as "Assigned toJane" and match
// nothing. innerText is the text as the page lays it out, with a break between
// block-level boxes. Like getByText, matching collapses whitespace and ignores
// case, and an element matches only when none of its children does, so a
// strict target still names one element and not its every ancestor.
//
// Playwright serialises the function and runs it in the page, so everything
// it uses is inside it. The selector body is a JSON string, so `>>` or quotes
// in the text never split the selector.
function createShownTextEngine() {
  const SKIPPED = new Set(['HEAD', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const BUTTON_INPUTS = 'input[type=button], input[type=submit]';

  function normalize(text) {
    return text
      .replace(/[\u200b\u00ad]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // innerText only adds whitespace to textContent and drops hidden text, so an
  // element whose textContent, spaces removed, lacks the string, spaces
  // removed, cannot match. This check skips the layout innerText costs on
  // almost every element.
  function squash(text) {
    return text.replace(/[\s\u200b\u00ad]/g, '').toLowerCase();
  }

  function queryAll(root, selector) {
    const needle = normalize(JSON.parse(selector));
    const squashed = squash(needle);
    const matches = [];
    // Children are visited first: an element with a matching child is no match
    // itself and needs no innerText, so innerText is read only on the
    // innermost candidates, not on every ancestor up to <html>.
    function visit(element) {
      if (SKIPPED.has(element.tagName) || !squash(element.textContent ?? '').includes(squashed)) {
        return false;
      }
      let childMatches = false;
      for (const child of element.children) {
        if (visit(child)) {
          childMatches = true;
        }
      }
      if (childMatches) {
        return true;
      }
      if (!normalize(element.innerText ?? element.textContent ?? '').includes(needle)) {
        return false;
      }
      matches.push(element);
      return true;
    }
    const start = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
    if (start) {
      visit(start);
      // A button input shows its value, which no textContent holds, so it is
      // looked for apart from the walk, as getByText finds it.
      const inputs = [
        ...(start.matches?.(BUTTON_INPUTS) ? [start] : []),
        ...start.querySelectorAll(BUTTON_INPUTS),
      ];
      for (const input of inputs) {
        if (normalize(input.value).includes(needle)) {
          matches.push(input);
        }
      }
    }
    return matches;
  }

  return {
    query(root, selector) {
      return queryAll(root, selector)[0] ?? null;
    },
    queryAll,
  };
}

let registered = null;

// Registers the engine with Playwright once per process. Playwright applies a
// registered engine to every browser context, open or yet to be created.
function registerShownTextEngine(selectors) {
  if (registered === null) {
    registered = selectors.register(SHOWN_TEXT_ENGINE, createShownTextEngine).catch((error) => {
      registered = null;
      throw error;
    });
  }
  return registered;
}

export default registerShownTextEngine;
