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

// Serialized into the journey's page by page.evaluate, so this function must be
// pure: it may reference nothing but `window`, `document` and its argument.
//
// Closes the step's window opened by installStepObserver and reads it: the
// trace emits, and how many mutated nodes are still in the document. A
// transient effect's nodes never count: antd's click wave inserts a holder
// with a wave node into every Button it clicks and removes it only when its
// motion ends, which a headless page may not reach within the step. Returns
// null when the document that opened the window is gone (a full page load).
function readStepObserver({ transientSelector }) {
  const observer = window.__lowdefyStepObserver;
  if (!observer || !observer.open) return null;
  observer.open = false;
  function isTransient(node) {
    if (node.nodeType !== 1) {
      return node.parentElement !== null && node.parentElement.closest(transientSelector) !== null;
    }
    if (node.closest(transientSelector) !== null) return true;
    const children = [...node.children];
    return children.length > 0 && children.every((child) => child.matches(transientSelector));
  }
  const counted = new Set(observer.nodes.filter((node) => node.isConnected && !isTransient(node)));
  return { emits: observer.emits, mutationCount: counted.size };
}

export default readStepObserver;
