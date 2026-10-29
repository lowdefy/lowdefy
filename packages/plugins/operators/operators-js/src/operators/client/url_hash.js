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

import { getFromObject } from '@lowdefy/operators';
import { urlQuery } from '@lowdefy/helpers';

// The URL fragment, parsed as a query string as _url_query parses the search.
// A browser never sends the fragment to the server, so a value here stays out
// of request logs and Referer headers: the magic-link landing page reads its
// sign-in token from it.
function _url_hash({ arrayIndices, globals, location, params }) {
  const { window } = globals;
  if (!window?.location) {
    throw new Error(`Browser window.location not available for _url_hash.`);
  }
  return getFromObject({
    arrayIndices,
    location,
    object: urlQuery.parse(window.location.hash.replace(/^#/, '')),
    operator: '_url_hash',
    params,
  });
}

_url_hash.dynamic = true;
// Reads window.location.hash live, which changes with no update to report it.
_url_hash.tracking = { kind: 'volatile' };

export default _url_hash;
