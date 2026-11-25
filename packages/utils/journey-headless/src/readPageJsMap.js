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

import evaluateJsModule from './evaluateJsModule.js';

// The _js functions a page runs with, as the web client's Page merges them: the build's client map
// (plugins.jsMap), with the page's own _jsEntries over it. _jsEntries is module text
// (`export default { [hash]: fn }`, evaluateJsModule). The dev server's page route folds a page's
// _js into its config this way, since a page it builds on demand can add _js after the client map
// was loaded; a page with none runs on the map alone.
function readPageJsMap({ jsMap, pageConfig }) {
  const jsEntries = pageConfig._jsEntries;
  if (type.isNone(jsEntries)) {
    return jsMap;
  }
  return { ...jsMap, ...evaluateJsModule(jsEntries) };
}

export default readPageJsMap;
