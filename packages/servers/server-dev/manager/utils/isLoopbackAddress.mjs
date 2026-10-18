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

import net from 'node:net';

// A dual-stack listener reports an IPv4 peer as ::ffff:<address>.
function isLoopbackAddress(address) {
  if (typeof address !== 'string') {
    return false;
  }
  const plain = address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address;
  if (net.isIPv4(plain)) {
    return plain.startsWith('127.');
  }
  return plain === '::1';
}

export default isLoopbackAddress;
