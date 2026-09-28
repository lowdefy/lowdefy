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

import { getFromObject, getMediaViewport, getObjectReadKeys } from '@lowdefy/operators';

function getDarkModePreference(window) {
  return window.localStorage?.getItem('lowdefy_darkMode') ?? 'system';
}

function getDarkMode(window) {
  return window.__lowdefy_isDark ?? false;
}

function _media({ arrayIndices, location, params, globals }) {
  const { window } = globals;
  if (!window?.innerWidth) {
    throw new Error(`device window width not available for _media.`);
  }
  const media = {
    ...getMediaViewport({ window }),
    darkMode: getDarkMode(window),
    darkModePreference: getDarkModePreference(window),
  };
  return getFromObject({
    arrayIndices,
    location,
    object: media,
    operator: '_media',
    params,
  });
}

_media.dynamic = true;
// The page's resize listener reports media:size, media:width and media:height when they change, so
// a block reading _media: size re-evaluates only when the breakpoint changes. Dark mode changes
// re-render the app, and that render-time full pass evaluates every block (as for _theme).
_media.tracking = {
  kind: 'read',
  keys: ({ arrayIndices, params }) =>
    getObjectReadKeys({ arrayIndices, namespace: 'media', params }),
};

export default _media;
