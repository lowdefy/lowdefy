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

import net from 'net';

import { type } from '@lowdefy/helpers';

function getHostname(host) {
  const trimmed = host.trim();
  if (trimmed.startsWith('[')) {
    return trimmed.slice(1, trimmed.indexOf(']'));
  }
  return trimmed.split(':')[0];
}

// Whether a Host header is one DNS rebinding cannot produce - the rule Vite's
// dev server applies to every HTTP request: an IP address, localhost or a
// *.localhost name. A page that rebinds its own domain to this machine still
// sends that domain as the Host. A request with no Host is not a browser's.
function isRebindingSafeHost({ host }) {
  if (type.isNone(host)) {
    return true;
  }
  const hostname = getHostname(host).toLowerCase();
  if (net.isIP(hostname) !== 0) {
    return true;
  }
  return hostname === 'localhost' || hostname.endsWith('.localhost');
}

export default isRebindingSafeHost;
