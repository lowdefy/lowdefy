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

import originPort from './originPort.js';

function envValue({ env, name }) {
  const value = env[name] ?? env[name.toLowerCase()];
  return value === '' ? undefined : value;
}

// Chromium's proxy switches for a browser that serves one origin. Host resolver rules only apply
// to a host Chromium resolves itself: a proxied request is resolved by the proxy, which can reach
// the dev server under a LAN address or an /etc/hosts alias with no data cookie. So the proxy
// configuration is always explicit, and every host on the origin's port goes direct, where the
// rules refuse it. A proxy named in the environment (HTTPS_PROXY, HTTP_PROXY, ALL_PROXY, with
// NO_PROXY) is kept for every other port; any other proxy, such as the operating system's or a
// debugging proxy's, is not used at all, since Chromium takes a bypass list only with an explicit
// proxy server.
function proxyLaunchArgs({ origin, env }) {
  const all = envValue({ env, name: 'ALL_PROXY' });
  const http = envValue({ env, name: 'HTTP_PROXY' });
  const https = envValue({ env, name: 'HTTPS_PROXY' });
  const noProxy = envValue({ env, name: 'NO_PROXY' }) ?? '';
  if (noProxy.trim() === '*') {
    return ['--no-proxy-server'];
  }
  const servers = [];
  if (http !== undefined) {
    servers.push(`http=${http}`);
  }
  if (https !== undefined) {
    servers.push(`https=${https}`);
  }
  if (servers.length === 0 && all !== undefined) {
    servers.push(all);
  }
  if (servers.length === 0) {
    return ['--no-proxy-server'];
  }
  const bypass = [`*:${originPort({ url: new URL(origin) })}`];
  noProxy
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .forEach((entry) => bypass.push(entry.startsWith('.') ? `*${entry}` : entry));
  return [`--proxy-server=${servers.join(';')}`, `--proxy-bypass-list=${bypass.join(';')}`];
}

export default proxyLaunchArgs;
