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

import { LowdefyInternalError } from '@lowdefy/errors';
import { pageInstanceKey } from '@lowdefy/helpers';

import createContext from './createContext.js';
import keepPageInstance from './keepPageInstance.js';

// A page with placeholders in its path has one context per set of values (pathParams, as the
// server matched them from the URL), stored under its instance key. A page without placeholders
// has one context, under `page:{pageId}`.
function getContext({
  config,
  jsMap = {},
  lowdefy,
  pathParams = {},
  resetContext = { reset: false, setReset: () => undefined },
}) {
  if (!config) {
    throw new LowdefyInternalError('A page must be provided to get context.');
  }
  const { pageId } = config;
  const instanceKey = pageInstanceKey({ pageId, path: config.path, pathParams });
  keepPageInstance({ lowdefy, pageId, instanceKey });
  // Dynamic pages are server-resolved per request — a context memoized across
  // navigations would render the previous request's content. Rebuild when a
  // new config object arrives (a fresh fetch), but stay memoized across
  // re-renders of the same config: getContext runs in the render body, so
  // rebuilding per render would loop.
  const sameDynamicConfig =
    config.dynamic !== true || lowdefy.contexts[instanceKey]?._internal.pageConfig === config;
  if (lowdefy.contexts[instanceKey] && !resetContext.reset && sameDynamicConfig) {
    // memoize context if already created, eg between page transitions, unless the reset flag is
    // raised. A full pass: this render-time update is how changes with no reporting hook reach the
    // page - user, i18n, theme, menus, inputs and the URL.
    lowdefy.contexts[instanceKey]._internal.update();
    return lowdefy.contexts[instanceKey];
  }
  // Lower the context reset flag — only when raised: setReset is a React
  // state setter on the Reload component, and getContext runs in the render
  // body, so skip the redundant cross-component setState on rebuilds where
  // the flag is already down.
  if (resetContext.reset) {
    resetContext.setReset(false);
  }
  if (!lowdefy.inputs[instanceKey]) {
    lowdefy.inputs[instanceKey] = {};
  }
  const ctx = createContext({ config, instanceKey, jsMap, lowdefy, pathParams });
  lowdefy.contexts[instanceKey] = ctx;
  return ctx;
}

export default getContext;
