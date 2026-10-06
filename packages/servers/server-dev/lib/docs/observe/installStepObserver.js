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
// Opens a step's window in the page. Installed once per document (a
// full page load replaces it, so each step installs it again if needed): it
// subscribes to the engine's trace registry and keeps each completed event's
// value-free summary, and records the nodes DOM mutations added or changed
// under document.body. Only what happens while a window is open is kept.
// Throws when the page has no trace registry: a step's window never guesses.
function installStepObserver() {
  const lowdefy = window.lowdefy;
  if (!lowdefy || !lowdefy._trace || typeof lowdefy._trace.subscribe !== 'function') {
    throw new Error(
      'The page has no Lowdefy trace registry (window.lowdefy._trace), so its events cannot be observed. Restart the dev server so pages load the current client.'
    );
  }
  let observer = window.__lowdefyStepObserver;
  if (!observer) {
    observer = { open: false, emits: [], nodes: [] };
    lowdefy._trace.subscribe((payload) => {
      if (!observer.open) return;
      observer.emits.push({
        scope: payload.scope ?? null,
        pageId: payload.pageId ?? null,
        blockId: payload.blockId ?? null,
        blockType: payload.blockType ?? null,
        eventName: payload.eventName ?? null,
        success: payload.success,
        failure: payload.failure ?? null,
      });
    });
    const mutations = new MutationObserver((records) => {
      if (!observer.open) return;
      records.forEach((record) => {
        if (record.type === 'childList') {
          record.addedNodes.forEach((node) => observer.nodes.push(node));
          return;
        }
        observer.nodes.push(record.target);
      });
    });
    mutations.observe(document.body, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
    });
    window.__lowdefyStepObserver = observer;
  }
  observer.emits = [];
  observer.nodes = [];
  observer.open = true;
  return true;
}

export default installStepObserver;
