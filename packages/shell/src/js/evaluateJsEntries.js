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

/**
 * The one place the shell turns `_js` source into functions. A shell is shared by every app, so
 * it cannot carry an app's compiled clientJsMap: each mobile page, and the mobile root for the
 * app events, carries its `_js` as `_jsEntries`, the module text the build generates
 * (`export default { [hash]: fn }`). It is evaluated with `new Function`, as the dev server
 * evaluates a page it builds on request (server-dev usePageConfig), and keeps the `volatile` flag
 * the module sets for dependency tracking.
 *
 * Hermes must run `new Function` for this to work. Should it not, `_js` on mobile pages becomes a
 * build error, and this function the one place that refuses it.
 *
 * @param {string|null|undefined} jsEntries The module text; none when the page has no `_js`.
 * @returns {Object} `{ [hash]: fn }`, the jsMap the engine's `_js` operator reads.
 */
function evaluateJsEntries(jsEntries) {
  if (type.isNone(jsEntries)) {
    return {};
  }
  const define = new Function('exports', jsEntries.replace('export default', 'exports.default ='));
  const module = {};
  define(module);
  return module.default;
}

export default evaluateJsEntries;
