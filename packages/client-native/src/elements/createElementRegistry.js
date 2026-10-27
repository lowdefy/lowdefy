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

function keyOf({ blockId, kind, pageId }) {
  return `${kind}:${pageId}:${blockId ?? ''}`;
}

/**
 * The native views of the pages on screen, found by page and block id, as a browser finds a
 * block's element with `document.getElementById`. Native actions such as SetFocus and ScrollTo
 * read it through `globals.elements`.
 *
 * Kinds:
 * - `view`: the view a block is placed in (BlockLayout).
 * - `input`: the control a block focuses, registered by the block itself (a TextInput).
 * - `scroll`: the page's ScrollView, with no block id.
 *
 * The same page may be on screen twice (a tab's stack holding it with other path values); the
 * view registered last, the screen on top, is found.
 */
function createElementRegistry() {
  const entries = new Map();

  // Returns the function that removes this registration.
  function register({ blockId, element, kind, pageId }) {
    const key = keyOf({ blockId, kind, pageId });
    const entry = { element };
    entries.set(key, [...(entries.get(key) ?? []), entry]);
    return () => {
      const rest = (entries.get(key) ?? []).filter((item) => item !== entry);
      if (rest.length === 0) {
        entries.delete(key);
        return;
      }
      entries.set(key, rest);
    };
  }

  function find({ blockId, kind, pageId }) {
    const list = entries.get(keyOf({ blockId, kind, pageId }));
    if (list === undefined) {
      return null;
    }
    return list[list.length - 1].element;
  }

  return { find, register };
}

export default createElementRegistry;
