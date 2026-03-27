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

import { ConfigError } from '@lowdefy/errors';

function resolveDepTarget({ moduleEntry, depName, context }) {
  const wiring = moduleEntry.moduleDependencies ?? {};
  const targetEntryId = wiring[depName];

  if (!targetEntryId) {
    throw new ConfigError(
      `Module "${moduleEntry.id}" references dependency "${depName}" ` +
        `but no mapping exists. Add dependencies.${depName} to the entry.`
    );
  }

  const targetEntry = context.modules[targetEntryId];
  if (!targetEntry) {
    throw new ConfigError(
      `Module "${moduleEntry.id}" dependency "${depName}" maps to ` +
        `"${targetEntryId}" but no module entry "${targetEntryId}" exists.`
    );
  }

  return targetEntry;
}

export default resolveDepTarget;
