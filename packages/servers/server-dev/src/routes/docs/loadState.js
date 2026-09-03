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

import loadState from '../../../lib/docs/loadState.js';
import parseUserParam from './parseUserParam.js';

// Loads a state checkpoint back into the running app. mode: 'headless'
// (default) drives a headless page and injects state directly for an agent
// to verify; mode: 'registry-only' just returns a URL for a human to open in
// a real browser tab (client/Inspector.jsx does the state injection there).
// Both modes leave the checkpoint's recorded requests replaying for the whole
// app until the next build, unless replayRequests is false.
async function docsLoadStateHandler(c) {
  const body = await c.req.json();
  const { name, mode, replayRequests } = body;
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const { user, error: userError } = parseUserParam({ value: body.user });
  if (userError) {
    return c.json({ error: userError }, 400);
  }

  const result = await loadState({ origin, name, mode, replayRequests, user });
  if (result.error) {
    // A contradictory call (`user` in 'registry-only' mode) is the caller's
    // mistake, not a failed render — 502 would read as "the renderer broke" and
    // invite a pointless retry of the same request.
    const status = result.invalidInput ? 400 : 502;
    return c.json({ error: result.error }, status);
  }
  return c.json(result);
}

export default docsLoadStateHandler;
