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

import type from './type.js';

// Whether a value is exactly one https or wss origin, as an mcp.viewSources
// entry must be. The entries go into the content security policy a host
// builds for an MCP App view, where anything else - a wildcard, a keyword such
// as 'unsafe-inline', an origin with a path - would widen the policy or be
// dropped by the host without a word.
function isViewSourceOrigin(value) {
  // A host pattern such as https://*.example.com parses as a URL.
  if (!type.isString(value) || value.includes('*')) {
    return false;
  }
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'wss:') {
    return false;
  }
  // The origin of a wss URL is its https form in some runtimes, so the origin
  // is put together from its parts.
  return `${url.protocol}//${url.host}` === value;
}

export default isViewSourceOrigin;
