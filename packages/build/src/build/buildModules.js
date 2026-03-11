/* eslint-disable no-param-reassign */

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
import { serializer, type } from '@lowdefy/helpers';

import resolveModuleOperators from './resolveModuleOperators.js';

function validateModuleSecrets({ content, manifest, entryId }) {
  const declaredSecrets = new Set((manifest.secrets ?? []).map((s) => s.name));

  serializer.copy(content, {
    reviver: (_, value) => {
      if (!type.isObject(value)) return value;
      const keys = Object.keys(value).filter((k) => !k.startsWith('~'));
      if (keys.length !== 1) return value;
      if (!type.isUndefined(value['_secret'])) {
        const secretName = value['_secret'];
        if (type.isString(secretName) && !declaredSecrets.has(secretName)) {
          throw new ConfigError(
            `Module "${entryId}" references secret "${secretName}" ` +
              `but does not declare it in module.lowdefy.yaml secrets. ` +
              `Add it to the module's secrets list or remove the reference.`
          );
        }
      }
      return value;
    },
  });
}

function buildModules({ components, context }) {
  const moduleEntries = components.modules ?? [];
  delete components.modules;

  for (const entry of moduleEntries) {
    const moduleEntry = context.modules[entry.id];

    if (!moduleEntry) {
      throw new ConfigError(
        `Module entry "${entry.id}" not registered. ` +
          `Check that buildModuleDefs ran successfully.`
      );
    }

    const manifest = moduleEntry.manifest;

    // Validate connection remapping keys
    const remapping = moduleEntry.connections ?? {};
    const moduleConnIds = new Set((manifest.connections ?? []).map((c) => c.id));
    for (const remapKey of Object.keys(remapping)) {
      if (!moduleConnIds.has(remapKey)) {
        throw new ConfigError(
          `Module "${entry.id}" connection remapping references "${remapKey}", ` +
            `but the module does not export a connection with that id.`
        );
      }
    }

    // Validate secret whitelist on non-remapped content
    for (const page of manifest.pages ?? []) {
      validateModuleSecrets({ content: page, manifest, entryId: entry.id });
    }
    for (const conn of manifest.connections ?? []) {
      if (remapping[conn.id]) continue;
      validateModuleSecrets({ content: conn, manifest, entryId: entry.id });
    }
    for (const endpoint of manifest.api ?? []) {
      validateModuleSecrets({ content: endpoint, manifest, entryId: entry.id });
    }

    // Process pages
    for (const page of manifest.pages ?? []) {
      const processed = resolveModuleOperators({
        input: page,
        moduleEntry,
      });
      processed.id = `${entry.id}/${processed.id}`;
      components.pages = components.pages ?? [];
      components.pages.push(processed);
    }

    // Process connections (skip remapped -- app provides those)
    for (const conn of manifest.connections ?? []) {
      if (remapping[conn.id]) continue;
      const processed = resolveModuleOperators({
        input: conn,
        moduleEntry,
      });
      processed.id = `${entry.id}/${processed.id}`;
      components.connections = components.connections ?? [];
      components.connections.push(processed);
    }

    // Process API endpoints
    for (const endpoint of manifest.api ?? []) {
      const processed = resolveModuleOperators({
        input: endpoint,
        moduleEntry,
      });
      processed.id = `${entry.id}/${processed.id}`;
      components.api = components.api ?? [];
      components.api.push(processed);
    }
  }

  return components;
}

export default buildModules;
