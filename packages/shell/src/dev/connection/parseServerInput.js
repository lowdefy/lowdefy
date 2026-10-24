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

import parseDevLink from './parseDevLink.js';
import parseServerUrl from './parseServerUrl.js';

/**
 * What a developer typed or pasted on the connect screen: a server URL (`192.168.1.20:3000`,
 * `http://...`) or the whole link `lowdefy dev --lan` prints. Returns `{ url, host, pair }`, or
 * `{ error }`.
 */
function parseServerInput({ input, scheme }) {
  const link = parseDevLink({ link: input?.trim(), scheme });
  if (link?.kind === 'connect') {
    return { url: link.url, host: link.host, pair: link.pair };
  }
  if (link?.kind === 'invalid') {
    return { error: link.reason };
  }
  const server = parseServerUrl(input);
  if (server === null) {
    return { error: 'Enter the address lowdefy dev prints, like http://192.168.1.20:3000.' };
  }
  return { url: server.url, host: server.host, pair: null };
}

export default parseServerInput;
