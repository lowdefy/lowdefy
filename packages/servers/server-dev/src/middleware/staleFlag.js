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

import getStaleStatus from '../../lib/docs/getStaleStatus.js';

// Marks every /lowdefy-docs response while the last dev build failed, so an
// agent reading a page config or a schema is told the answer comes from the
// previous build rather than from its own edits. One mechanical hook for the
// whole route group — the MCP surface has its own in createDocsMcpServer.
function staleFlag() {
  return async function staleFlagMiddleware(c, next) {
    await next();
    // The build manager rewrites buildStatus.json while the server is
    // answering, so a half-written artifact is a real race — flagging must
    // never be the reason a docs response fails.
    let status;
    try {
      status = getStaleStatus();
    } catch {
      return;
    }
    if (type.isNone(status)) return;

    // The headers carry the flag on every content type, including the ones
    // whose body is left alone below.
    c.res.headers.set('X-Lowdefy-Stale', 'true');
    if (!type.isNone(status.staleSince)) {
      c.res.headers.set('X-Lowdefy-Stale-Since', status.staleSince);
    }

    const contentType = c.res.headers.get('Content-Type') ?? '';

    if (contentType.includes('application/json')) {
      const body = await c.res.clone().json();
      // A JSON array body would have to change shape to carry a field, and
      // shape stability beats uniformity here — the headers still flag it.
      if (!type.isObject(body)) return;
      const merged = { ...body };
      // Never overwrite a key the handler already set.
      for (const key of ['stale', 'staleSince', 'staleReason']) {
        if (!(key in merged)) merged[key] = status[key];
      }
      c.res = new Response(JSON.stringify(merged), {
        status: c.res.status,
        headers: c.res.headers,
      });
      return;
    }

    if (contentType.includes('text/markdown')) {
      const body = await c.res.clone().text();
      c.res = new Response(`> STALE: ${status.staleReason}\n\n${body}`, {
        status: c.res.status,
        headers: c.res.headers,
      });
    }
    // Every other content type (PNG screenshots, plain text) is left untouched.
  };
}

export default staleFlag;
