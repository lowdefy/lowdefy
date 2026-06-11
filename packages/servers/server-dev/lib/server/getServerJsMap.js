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

import staticJsMap from '../../build/plugins/operators/serverJsMap.js';
import getDevState from './devState.js';

// Must match the prototype writeJs emits for plugins/operators/serverJsMap.js.
const SERVER_JS_PROTOTYPE = '{ args, item, lowdefyApp, payload, secret, state, step, user }';

const compiled = new Map();

// The static import covers skeleton-known _js functions and reloads through
// the SSR module graph when the build rewrites the file. JIT page builds add
// content-hashed entries to the shared in-memory jsMap — compile those on
// demand so requests on a freshly built page work immediately, without
// depending on a module-graph round trip.
function getServerJsMap() {
  const source = getDevState().buildContext.jsMap.server ?? {};
  let map = staticJsMap;
  for (const [hash, body] of Object.entries(source)) {
    if (map[hash]) continue;
    if (!compiled.has(hash)) {
      compiled.set(hash, new Function(`return (${SERVER_JS_PROTOTYPE}) => { ${body} };`)());
    }
    if (map === staticJsMap) {
      map = { ...staticJsMap };
    }
    map[hash] = compiled.get(hash);
  }
  return map;
}

export default getServerJsMap;
