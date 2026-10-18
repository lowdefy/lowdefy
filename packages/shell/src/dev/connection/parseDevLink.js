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

import parseQuery from './parseQuery.js';
import parseServerUrl from './parseServerUrl.js';

/**
 * What a Lowdefy Dev link asks for, or null for any other URL (the app's own deep links):
 * - `lowdefy-dev://connect?url=<server>&pair=<token>`: `{ kind: 'connect', url, host, pair }`,
 *   as `lowdefy dev --lan` prints it in its QR code, and `--ios`/`--android` open it (no pair).
 * - `lowdefy-dev://menu`: `{ kind: 'menu' }`, the shake menu, for a simulator that cannot shake.
 * A connect link without a usable url is `{ kind: 'invalid', reason }`.
 *
 * @param {Object} params
 * @param {string} params.link The URL the app was opened with.
 * @param {string} params.scheme The shell's URL scheme (lowdefy-dev).
 */
function parseDevLink({ link, scheme }) {
  if (!type.isString(link) || !type.isString(scheme)) {
    return null;
  }
  const prefix = `${scheme.toLowerCase()}://`;
  if (!link.toLowerCase().startsWith(prefix)) {
    return null;
  }
  const rest = link.slice(prefix.length);
  const queryIndex = rest.indexOf('?');
  const target = (queryIndex === -1 ? rest : rest.slice(0, queryIndex)).replace(/\/+$/, '');
  const query = parseQuery(queryIndex === -1 ? '' : rest.slice(queryIndex + 1).split('#')[0]);
  if (target === 'menu') {
    return { kind: 'menu' };
  }
  if (target !== 'connect') {
    return null;
  }
  const server = parseServerUrl(query.url);
  if (server === null) {
    return {
      kind: 'invalid',
      reason: `The link has no dev server url. Received ${JSON.stringify(query.url ?? null)}.`,
    };
  }
  return {
    kind: 'connect',
    url: server.url,
    host: server.host,
    pair: type.isString(query.pair) && query.pair.length > 0 ? query.pair : null,
  };
}

export default parseDevLink;
