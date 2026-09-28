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

import createInitialState from './createInitialState.js';
import deriveValue from './deriveValue.js';

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
  api.contains = (element) => Boolean(api.rootRef.current?.contains(element));
  // The block value of the current state, and of any value once the fallback rules are applied
  // (a saved view resolves to the view the table would write after loading it).
  api.getValue = () => deriveValue({ state: api.state, api });
  api.resolveValue = (value) =>
    deriveValue({ state: createInitialState({ value, config: api.config, rows: [] }), api });
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
