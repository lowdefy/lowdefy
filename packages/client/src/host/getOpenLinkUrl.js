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

// The only schemes a view hands to its host to open. javascript: and data: run
// script, file: reads the device, and the rest name no page a browser opens.
const openProtocols = new Set(['http:', 'https:']);

// The absolute URL a view asks its host to open for a link, or null when the
// link must not be opened. base is the view's address on the app's origin, so
// a relative link ("/reports", "?tab=2") names a page of the app and never one
// of the host's sandbox origin.
function getOpenLinkUrl({ base, url }) {
  if (type.isNone(url)) {
    return null;
  }
  // window.open also takes a URL object.
  const value = String(url);
  if (value === '') {
    return null;
  }
  let parsed;
  try {
    parsed = new URL(value, base);
  } catch (error) {
    // The URL parser is the only complete check of a link.
    return null;
  }
  if (!openProtocols.has(parsed.protocol)) {
    return null;
  }
  return parsed.href;
}

export default getOpenLinkUrl;
