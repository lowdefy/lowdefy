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

// A reserved origin: a URL that resolves to it stays on the app.
const SENTINEL = 'https://app.invalid';

// Decides one URL. Same-origin values are allowed, except that navigation
// (href, url, Link) may only name an app path for a page the policy lists.
// Anything else must be http(s) on an origin the policy lists. `schemeless`
// mirrors the engine's link resolver (engine/src/resolveTarget.js,
// classifyUrl), which reads a colon-less `url` such as `example.com` as
// `https://example.com`.
function isAllowedUrl({ value, policy, navigation, schemeless }) {
  if (value === '' || value.startsWith('#')) {
    return true;
  }
  const candidate =
    schemeless && !value.includes(':') && !value.startsWith('/') ? `https://${value}` : value;
  let url;
  try {
    url = new URL(candidate, SENTINEL);
  } catch {
    return false;
  }
  if (url.origin === SENTINEL) {
    return !navigation || policy.links.pages.includes(url.pathname.slice(1));
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }
  return policy.links.origins.includes(url.origin);
}

export default isAllowedUrl;
