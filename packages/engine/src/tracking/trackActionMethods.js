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

import { type } from '@lowdefy/helpers';

// Action methods that read, or that report every change they make. Actions reach page context only
// through their methods, so every other method (auth, navigation, Reset, Validate, CallMethod,
// CallAPI, WebSockets, and any method added later) makes the next update a full pass.
const reportingMethods = new Set([
  'displayMessage',
  'getActions',
  'getBlockId',
  'getEvent',
  'getGlobal',
  'getInput',
  'getLocale',
  'getPageId',
  'getRequestDetails',
  'getState',
  'getUrlQuery',
  'getUser',
  'request',
  'setGlobal',
  'setState',
  'translate',
]);

// Asked for before the call, in case the method runs an update itself, and again once it has
// finished, since an async method (UpdateSession, Login) changes context after it resolves.
function trackActionMethods({ context, methods }) {
  const { requireFullUpdate } = context._internal.DependencyTracker;
  const tracked = {};
  Object.entries(methods).forEach(([name, method]) => {
    if (reportingMethods.has(name)) {
      tracked[name] = method;
      return;
    }
    tracked[name] = function fullUpdateActionMethod(...args) {
      requireFullUpdate();
      const result = method(...args);
      if (type.isFunction(result?.then)) {
        return Promise.resolve(result).finally(requireFullUpdate);
      }
      requireFullUpdate();
      return result;
    };
  });
  return tracked;
}

export default trackActionMethods;
