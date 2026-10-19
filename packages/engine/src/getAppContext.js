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

import createContext from './createContext.js';

// App events are not page config: the app context runs them on a root without
// blocks, so they have no page state, inputs or requests. Box is the root because
// every app bundles it (a container, so it has no value in state).
function getAppContext({ events, jsMap = {}, lowdefy }) {
  if (lowdefy.appContext) {
    return lowdefy.appContext;
  }
  const ctx = createContext({
    config: { id: 'app', blockId: 'app', type: 'Box', events },
    instanceKey: 'app',
    jsMap,
    lowdefy,
    pathParams: {},
  });
  const _internal = ctx._internal;
  // Global and API responses are app-wide: a change an app event makes must
  // re-render the pages, and reportAppChange has already reported it to them.
  const updateAppRoot = _internal.update;
  _internal.update = (options) => {
    updateAppRoot(options);
    Object.values(lowdefy.contexts).forEach((pageContext) => {
      pageContext._internal.update({ changes: [] });
    });
  };
  // Every page mount asks for the app events, and a navigation can mount the
  // next page before they finish, so each runs once and later callers share it.
  const runOnInit = _internal.runOnInit;
  const runOnInitAsync = _internal.runOnInitAsync;
  let onInitPromise = null;
  let onInitAsyncPromise = null;
  _internal.runOnInit = (progress) => {
    if (!onInitPromise) {
      onInitPromise = runOnInit(progress);
    }
    return onInitPromise;
  };
  _internal.runOnInitAsync = (progress) => {
    if (!onInitAsyncPromise) {
      onInitAsyncPromise = _internal.runOnInit(progress).then(() => runOnInitAsync(progress));
    }
    return onInitAsyncPromise;
  };
  lowdefy.appContext = ctx;
  return ctx;
}

export default getAppContext;
