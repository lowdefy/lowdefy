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

import createLocation from './createLocation.js';

// The host globals a page has without a browser (the engine's getGlobals.js): a window with the
// page's location and a desktop viewport, so _media answers as a 1440 by 900 browser does, and
// no document, which the engine, resolveTarget and readMediaViewport already allow for. fetch is
// Node's own, for the Fetch action.
function createNodeGlobals({ path, urlQuery }) {
  return {
    fetch: (input, init) => fetch(input, init),
    window: {
      innerHeight: 900,
      innerWidth: 1440,
      location: createLocation({ path, urlQuery }),
    },
  };
}

export default createNodeGlobals;
