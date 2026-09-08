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

// A URL fit for an access log: origin and path only. Query strings and
// fragments are where credentials travel - the magic-link verify token, the
// signed OAuth query on the consent and post-login pages - and the browser
// echoes the whole page URL back as the Referer of every fetch that page
// makes, so logging the header verbatim writes those secrets into the log
// store on each request. Nothing in an access line needs the query: the rid
// correlates, the path identifies. Returns undefined for a missing value and
// the input untouched when it does not parse as an absolute URL, so a
// malformed header is still visible rather than silently dropped.
function stripUrlQuery(url) {
  if (typeof url !== 'string' || url === '') {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

export default stripUrlQuery;
