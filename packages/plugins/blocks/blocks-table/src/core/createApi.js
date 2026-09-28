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

// The table's per-instance API object: one stable mutable object that the core refreshes on every
// render (table, config, state, layout, ...), so delegated event handlers, actions and methods
// always read current values without being recreated.
function createApi() {
  const api = {
    actions: {},
    foreignKeys: new Map(),
    rootRef: { current: null },
    scrollerRef: { current: null },
    suppressedClick: false,
  };
  // Cell renderers build the full event payload (row, rowKey, ...); one stable function keeps
  // the memoised cells from re-rendering when the block's methods object changes.
  api.onCellEvent = ({ name, event }) => api.methods.triggerEvent({ name, event });
  api.contains = (element) => Boolean(api.rootRef.current?.contains(element));
  api.suppressClick = () => {
    api.suppressedClick = true;
    // A drag that ends outside the header produces no click; do not swallow the next one.
    setTimeout(() => {
      api.suppressedClick = false;
    }, 0);
  };
  api.takeSuppressedClick = () => {
    const suppressed = api.suppressedClick;
    api.suppressedClick = false;
    return suppressed;
  };
  return api;
}

export default createApi;
