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

import { jest } from '@jest/globals';

function createResponse({ body = null, headers = {}, status = 200 }) {
  const lowerHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => lowerHeaders[name.toLowerCase()] ?? null },
    json: async () => structuredClone(body),
  };
}

function header(init, name) {
  const entry = Object.entries(init?.headers ?? {}).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return entry?.[1] ?? null;
}

/**
 * A Lowdefy server for the shell's tests. `state` holds what it serves and may be changed between
 * calls: `caller` (the x-lowdefy-caller stamp), `user`, `root` and its `rootEtag`, `pages`
 * ({ [path]: { pageConfig, etag } }), `buildId`, and `requests` (a function answering
 * /api/request/* calls). A matching If-None-Match gets a 304. Every call is in `fetch.mock.calls`.
 */
function createFakeServer(initial) {
  const state = { buildId: 'build-1', caller: '', user: null, ...initial };
  const fetch = jest.fn(async (url, init) => {
    const { pathname } = new URL(url);
    const callerHeaders = { 'x-lowdefy-caller': state.caller };
    if (pathname === '/api/mobile/root') {
      if (header(init, 'if-none-match') === state.rootEtag) {
        return createResponse({ status: 304, headers: { ...callerHeaders, etag: state.rootEtag } });
      }
      return createResponse({
        body: state.root,
        headers: { ...callerHeaders, etag: state.rootEtag },
      });
    }
    if (pathname === '/api/user') {
      return createResponse({ body: { user: state.user } });
    }
    if (pathname.startsWith('/api/page/')) {
      const path = decodeURIComponent(pathname.slice('/api/page/'.length));
      const page = state.pages[path];
      if (page === undefined) {
        return createResponse({
          status: 404,
          body: state.otherSurfaces?.[path] ?? { pageConfig: null },
        });
      }
      if (header(init, 'if-none-match') === page.etag) {
        return createResponse({ status: 304, headers: { ...callerHeaders, etag: page.etag } });
      }
      return createResponse({
        body: { buildId: state.buildId, pageConfig: page.pageConfig },
        headers: { ...callerHeaders, etag: page.etag },
      });
    }
    if (pathname.startsWith('/api/request/')) {
      const build = header(init, 'x-lowdefy-build');
      if (build !== null && build !== state.buildId) {
        return createResponse({
          status: 409,
          body: { name: 'UserError', message: 'Other build.', buildId: state.buildId },
        });
      }
      return createResponse({ body: state.requests?.(url, init) ?? { success: true } });
    }
    return createResponse({ status: 404, body: {} });
  });
  return { fetch, state };
}

export { header };
export default createFakeServer;
