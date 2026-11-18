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

import createRefusedError from './createRefusedError.js';

// Hosts match exactly, ignoring case and the brackets of an IPv6 literal.
function checkAllowedHost({ allowedHosts, url }) {
  if (type.isNone(allowedHosts)) {
    return;
  }
  const normalizeHost = (host) => host.replace(/^\[|\]$/g, '').toLowerCase();
  const hostname = normalizeHost(new URL(url).hostname);
  if (allowedHosts.some((host) => normalizeHost(host) === hostname)) {
    return;
  }
  throw createRefusedError(
    `AxiosHttp request to "${hostname}" was refused because the host is not in the connection's "allowedHosts".`
  );
}

export default checkAllowedHost;
