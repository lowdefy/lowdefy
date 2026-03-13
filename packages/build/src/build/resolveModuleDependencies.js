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
import { type } from '@lowdefy/helpers';

function resolveModuleDependencies({ context }) {
  for (const [entryId, moduleEntry] of Object.entries(context.modules)) {
    const dependencies = moduleEntry.dependencies;
    const wiring = moduleEntry.moduleDependencies;

    // Auto-wire: for each declared dependency without an explicit mapping,
    // look for a module entry whose ID matches the dependency name
    for (const dep of dependencies) {
      if (type.isUndefined(wiring[dep.id])) {
        if (context.modules[dep.id]) {
          wiring[dep.id] = dep.id;
        }
      }
    }

    // Validate the wiring
    const declaredIds = new Set(dependencies.map((r) => r.id));

    // 1. Every declared dependency must be mapped (after auto-wire)
    for (const dep of dependencies) {
      if (type.isUndefined(wiring[dep.id])) {
        throw new ConfigError(
          `Module "${entryId}" declares dependency "${dep.id}" but no mapping provided ` +
            `and no module entry "${dep.id}" exists.` +
            (dep.description ? `\n  ${dep.id}: ${dep.description}` : '') +
            `\n  Add dependencies.${dep.id} to the "${entryId}" entry in lowdefy.yaml, ` +
            `or add a module entry with id "${dep.id}".`
        );
      }
    }

    // 2. No unknown keys in the wiring map
    for (const key of Object.keys(wiring)) {
      if (!declaredIds.has(key)) {
        throw new ConfigError(
          `Module "${entryId}" does not declare dependency "${key}". ` +
            `Check dependencies in lowdefy.yaml.` +
            `\n  Declared dependencies: ${[...declaredIds].join(', ') || '(none)'}`
        );
      }
    }

    // 3. All target entry IDs exist
    for (const [depName, targetEntryId] of Object.entries(wiring)) {
      if (!context.modules[targetEntryId]) {
        throw new ConfigError(
          `dependencies.${depName} references "${targetEntryId}" ` +
            `but no module entry "${targetEntryId}" exists.`
        );
      }
    }

    // 4. No self-referencing dependencies
    for (const [depName, targetEntryId] of Object.entries(wiring)) {
      if (targetEntryId === entryId) {
        throw new ConfigError(
          `Module "${entryId}" dependency "${depName}" maps to itself. ` +
            `A module cannot depend on its own entry.`
        );
      }
    }
  }
}

export default resolveModuleDependencies;
