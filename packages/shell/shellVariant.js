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

const path = require('node:path');

const VARIANTS = ['dev', 'release'];

// The module that holds Lowdefy Dev's developer features (connect, shake menu, dev-tab client).
// A release bundle resolves it to an empty module (metro.config.js), so a customer shell never
// carries them.
const DEV_ENTRY = path.join(__dirname, 'src', 'dev', 'index.js');

// The string the dev-tab client sends to the dev server. scripts/checkReleaseBundle.mjs fails when a
// release bundle holds it. Keep it in step with src/dev/tab/devClientMarker.js.
const DEV_CLIENT_MARKER = 'lowdefy-dev-tab-client';

// LOWDEFY_SHELL_VARIANT=dev | release. Without it, Lowdefy Dev (no LOWDEFY_SHELL_CONFIG) is dev and
// every other shell is release, so a customer shell leaves the developer features out unless its
// build asks for them.
function getShellVariant(env = process.env) {
  const variant = env.LOWDEFY_SHELL_VARIANT || (env.LOWDEFY_SHELL_CONFIG ? 'release' : 'dev');
  if (!VARIANTS.includes(variant)) {
    throw new Error(
      `LOWDEFY_SHELL_VARIANT must be "dev" or "release". Received ${JSON.stringify(variant)}.`
    );
  }
  return variant;
}

module.exports = { DEV_CLIENT_MARKER, DEV_ENTRY, getShellVariant };
