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

import createNativeLocation from './createNativeLocation.js';

/**
 * The host globals of one screen: the app's host globals, with a `window.location` that is the
 * screen's own route. A native stack shows several pages at once, and a page's engine context
 * reads its globals (engine getContext), so `_url_query` and `_location` read the route of the
 * screen the page is on, not the one on top or the last one to render.
 *
 * @param {Object} params
 * @param {Object} params.globals The app's host globals (createNativeGlobals).
 * @param {() => string} params.getPath The screen's route: path, query string and hash.
 */
function createScreenGlobals({ globals, getPath }) {
  const { assign, origin } = globals.window.location;
  const location = createNativeLocation({ assign, getPath, origin });
  // The window's size getters and listeners stay the app window's.
  const window = Object.create(globals.window, {
    location: { enumerable: true, value: location },
  });
  return { ...globals, window };
}

export default createScreenGlobals;
