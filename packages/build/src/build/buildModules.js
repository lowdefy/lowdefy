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
import { type } from '@lowdefy/helpers';

function checkSecretNodes({ value, declaredSecrets, entryId }) {
  if (type.isArray(value)) {
    for (const item of value) {
      checkSecretNodes({ value: item, declaredSecrets, entryId });
    }
    return;
  }
  if (!type.isObject(value)) return;
  // Only a single-non-tilde-key object is operator shape (matches
  // getRuntimeOperatorKey) — { _secret: 'X', extra: 1 } is deliberately not
  // treated as a secret reference.
  const keys = Object.keys(value).filter((k) => !k.startsWith('~'));
  if (keys.length === 1 && !type.isUndefined(value['_secret'])) {
    const secretName = value['_secret'];
    if (type.isString(secretName) && !declaredSecrets.has(secretName)) {
      throw new ConfigError(
        `Module "${entryId}" references secret "${secretName}" ` +
          `but does not declare it in module.lowdefy.yaml secrets. ` +
          `Add it to the module's secrets list or remove the reference.`
      );
    }
  }
  for (const key of Object.keys(value)) {
    checkSecretNodes({ value: value[key], declaredSecrets, entryId });
  }
}

import buildModuleAuth from './buildModuleAuth.js';

function validateModuleSecrets({ content, manifest, entryId }) {
  const declaredSecrets = new Set((manifest.secrets ?? []).map((s) => s.name));
  checkSecretNodes({ value: content, declaredSecrets, entryId });
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
            `but the module has no connection with that id.`
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
      page.id = `${entry.id}/${page.id}`;
      components.pages = components.pages ?? [];
      components.pages.push(page);
    }

    // Process connections (skip remapped -- app provides those)
    for (const conn of manifest.connections ?? []) {
      if (remapping[conn.id]) continue;
      conn.id = `${entry.id}/${conn.id}`;
      components.connections = components.connections ?? [];
      components.connections.push(conn);
    }

    // Process API endpoints
    for (const endpoint of manifest.api ?? []) {
      endpoint.id = `${entry.id}/${endpoint.id}`;
      components.api = components.api ?? [];
      components.api.push(endpoint);
    }
  }

  // Contribute manifest auth wiring (hooks, authPages roles, public pages)
  // with scoped ids - buildAuth validates the merged result downstream.
  buildModuleAuth({ components, context, moduleEntries });

  return components;
}

export default buildModules;
