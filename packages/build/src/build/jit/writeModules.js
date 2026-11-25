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

import { serializer } from '@lowdefy/helpers';

// modules.json: the module entries JIT page builds restore. Each entry's
// resolvedVarCache gains a key when a var is first read, and refs resolve in
// parallel, so it is written with its keys sorted: the cache is read by key,
// and two builds of the same config then write the same file, which the dev
// server compares to tell whether a config build changed what pages read.
async function writeModules({ context }) {
  const modules = context.modules ?? {};
  for (const moduleEntry of Object.values(modules)) {
    if (moduleEntry.resolvedVarCache) {
      moduleEntry.resolvedVarCache = Object.fromEntries(
        Object.entries(moduleEntry.resolvedVarCache).sort(([a], [b]) => (a < b ? -1 : 1))
      );
    }
  }
  await context.writeBuildArtifact('modules.json', serializer.serializeToString(modules));
}

export default writeModules;
