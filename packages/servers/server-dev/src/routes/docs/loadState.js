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

// Loads a state checkpoint back into the running app. mode: 'headless'
// (default) drives a headless page and injects state directly for an agent
// to verify; mode: 'registry-only' just loads the recorded requests into
// devMockRegistry and returns a URL for a human to open in a real browser
// tab (client/Inspector.jsx does the state injection there).
async function docsLoadStateHandler(c) {
  const { name, mode } = await c.req.json();
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const result = await loadState({ origin, name, mode });
  if (result.error) {
    return c.json({ error: result.error }, 502);
  }
  return c.json(result);
}

export default docsLoadStateHandler;
