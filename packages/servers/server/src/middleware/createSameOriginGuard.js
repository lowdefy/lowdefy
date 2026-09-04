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

// The one cross-site defence for the routes only this app's own pages call:
// /api/journey, /api/client-error and /api/feedback. Each of them writes to the
// app's log sink on the word of the browser, so a page on another site must not
// be able to post to them with the user's cookies attached.
//
// Two headers decide it, both set by the browser and neither settable by page
// script. `Sec-Fetch-Site` is the browser's own answer to "where did this come
// from": only `same-origin` and `none` (a user-initiated request, no initiator
// document) pass - `cross-site` and `same-site` are refused, so a sibling
// subdomain is refused too, which is what the Origin host comparison below has
// always done. `Origin` is then compared to the `Host` the request arrived on.
//
// A caller that sends no Origin is not a browser doing a cross-site post. Such
// a caller passes only where the route asks for it with `allowNoOrigin` - the
// three routes above do not, because nothing but a page has business calling
// them.
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'none']);

function isSameOrigin({ host, origin }) {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function createSameOriginGuard({ allowNoOrigin = false } = {}) {
  // Returns the 403 response to answer with, or null when the request may
  // proceed. A guard, not Hono middleware, so a route keeps one entry point
  // and the refusal is visible at the top of the handler that owns it.
  return function guardSameOrigin(c) {
    const fetchSite = c.req.header('sec-fetch-site');
    if (fetchSite && !ALLOWED_FETCH_SITES.has(fetchSite)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const origin = c.req.header('origin');
    if (!origin) {
      if (allowNoOrigin) {
        return null;
      }
      return c.json({ error: 'Forbidden' }, 403);
    }

    if (!isSameOrigin({ host: c.req.header('host'), origin })) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    return null;
  };
}

export default createSameOriginGuard;
