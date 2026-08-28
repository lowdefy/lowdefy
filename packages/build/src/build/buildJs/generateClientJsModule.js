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

import generateJsFile from './generateJsFile.js';

// Single definition of the client _js function prototype. Both the full build
// (writeJs) and the dev server's per-page fold (getPageJitEnrichment) generate
// client jsMap module text through here, so the destructured argument list has
// exactly one source of truth.
const CLIENT_JS_FUNCTION_PROTOTYPE = `{ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }`;

function generateClientJsModule(map) {
  return generateJsFile({ map, functionPrototype: CLIENT_JS_FUNCTION_PROTOTYPE });
}

export default generateClientJsModule;
