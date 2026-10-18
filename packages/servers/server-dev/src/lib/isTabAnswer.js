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

import getPathSegments from './getPathSegments.js';

// A dev tab's answer leg of the tab channel: POST /api/dev-inspect with the
// result of a request the dev server sent it, or POST /api/dev-inspect/page
// with the page it shows. A phone paired with `lowdefy dev --lan` is a dev tab
// and may send these; it may not list the tabs or load a checkpoint's mocks,
// which act on the developer's tabs.
function isTabAnswer(c) {
  if (c.req.method !== 'POST') {
    return false;
  }
  const segments = getPathSegments(c, '/api/dev-inspect/');
  return segments.length === 0 || (segments.length === 1 && segments[0] === 'page');
}

export default isTabAnswer;
