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

const MAX_BUILDS = 100;

// Insertion-ordered, so the oldest id is the first one dropped. Kept on
// globalThis because Vite re-evaluates the SSR module graph when a rebuild
// rewrites the build artifacts, which would empty a module-level set at the
// moment the recorder flushes the attempt the rebuild ended.
const BUILDS_KEY = Symbol.for('lowdefy.devServer.servedBuilds');
globalThis[BUILDS_KEY] ??= new Set();
const builds = globalThis[BUILDS_KEY];

// The build ids this Hono process has sent a page config under (jitPage.js
// adds each `_buildId`). The recording route keeps the build a record names
// only when it is in here: the page names the build it rendered, but cannot
// invent one.
function add(id) {
  if (!type.isString(id)) return;
  builds.delete(id);
  builds.add(id);
  if (builds.size > MAX_BUILDS) {
    builds.delete(builds.values().next().value);
  }
}

function has(id) {
  return type.isString(id) && builds.has(id);
}

export default { add, has };
