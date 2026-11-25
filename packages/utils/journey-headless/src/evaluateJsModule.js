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

// The { [hash]: fn } map a client _js module holds: module text the build generates
// (`export default { [hash]: fn }`, generateClientJsModule), evaluated as the dev client's
// fetchPageConfig evaluates a page's _jsEntries, keeping the `volatile` flag a function carries.
function evaluateJsModule(text) {
  const define = new Function('exports', text.replace('export default', 'exports.default ='));
  const module = {};
  define(module);
  return module.default;
}

export default evaluateJsModule;
