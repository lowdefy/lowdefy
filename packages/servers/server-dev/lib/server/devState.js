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

// The Hono app and the lowdefy() Vite plugin run in the same process — the
// plugin publishes in-memory build state (plugin/devState.mjs) before the
// SSR app first loads.
function getDevState() {
  const state = globalThis.__LOWDEFY_DEV__;
  if (!state) {
    throw new Error(
      'Lowdefy dev state is not initialized. The dev server must be started through Vite with the lowdefy() plugin (lowdefy dev).'
    );
  }
  return state;
}

export default getDevState;
