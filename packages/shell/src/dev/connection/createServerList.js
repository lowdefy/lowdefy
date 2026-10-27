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

const SERVERS_KEY = 'lowdefy-dev:servers';
const MAX_SERVERS = 5;

/**
 * The dev servers Lowdefy Dev connected to, the last one first: `[{ url, host, pair }]`, at most 5.
 * The pairing token is kept with its server; it lasts as long as that `lowdefy dev` session.
 *
 * @param {Object} params
 * @param {{ get, set }} params.kv The device store.
 */
function createServerList({ kv }) {
  function list() {
    const stored = JSON.parse(kv.get(SERVERS_KEY) ?? '[]');
    return type.isArray(stored) ? stored : [];
  }

  function remember({ url, host, pair }) {
    const servers = [
      { url, host, pair: pair ?? null },
      ...list().filter((server) => server.url !== url),
    ].slice(0, MAX_SERVERS);
    kv.set(SERVERS_KEY, JSON.stringify(servers));
    return servers;
  }

  return { last: () => list()[0] ?? null, list, remember };
}

export { SERVERS_KEY };
export default createServerList;
