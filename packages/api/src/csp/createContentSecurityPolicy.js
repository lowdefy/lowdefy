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

import crypto from 'node:crypto';

import getWebSocketSources from './getWebSocketSources.js';

// Builds the header for one page render from the policy the build resolved
// (build/security.json). Each call draws a new 128-bit nonce, which the page's
// inline scripts and styles carry.
function createContentSecurityPolicy({ policy, requestUrl, allowWebSocket }) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const directives = Object.entries(policy.directives).map(([directive, sources]) => {
    const directiveSources = [...sources];
    if (policy.nonceDirectives.includes(directive)) {
      directiveSources.push(`'nonce-${nonce}'`);
    }
    if (directive === 'connect-src' && allowWebSocket) {
      directiveSources.push(...getWebSocketSources({ requestUrl }));
    }
    return [directive, ...directiveSources].join(' ');
  });
  return {
    name: policy.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    nonce,
    value: directives.join('; '),
  };
}

export default createContentSecurityPolicy;
