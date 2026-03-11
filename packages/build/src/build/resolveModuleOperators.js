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

function scopeMenuItemIds(links, entryId) {
  if (!Array.isArray(links)) return;
  for (const item of links) {
    if (item.id) {
      item.id = `${entryId}/${item.id}`;
    }
    if (Array.isArray(item.links)) {
      scopeMenuItemIds(item.links, entryId);
    }
  }
}

function resolveModuleOperators({ input, moduleEntry }) {
  const reviver = (_, value) => {
    if (!type.isObject(value)) return value;

    const keys = Object.keys(value).filter((k) => !k.startsWith('~'));
    if (keys.length !== 1) return value;

    if (!type.isUndefined(value['_module.pageId'])) {
      const pageName = value['_module.pageId'];
      if (!type.isString(pageName)) {
        throw new ConfigError('_module.pageId requires a string page name.');
      }
      const manifest = moduleEntry.manifest;
      if (!(manifest.pages ?? []).some((p) => p.id === pageName)) {
        throw new ConfigError(
          `Module "${moduleEntry.id}" does not export page "${pageName}".`
        );
      }
      return `${moduleEntry.id}/${pageName}`;
    }

    if (!type.isUndefined(value['_module.connectionId'])) {
      const connName = value['_module.connectionId'];
      if (!type.isString(connName)) {
        throw new ConfigError('_module.connectionId requires a string connection name.');
      }
      const manifest = moduleEntry.manifest;
      if (!(manifest.connections ?? []).some((c) => c.id === connName)) {
        throw new ConfigError(
          `Module "${moduleEntry.id}" does not export connection "${connName}".`
        );
      }
      const remapping = moduleEntry.connections ?? {};
      if (remapping[connName]) {
        return remapping[connName];
      }
      return `${moduleEntry.id}/${connName}`;
    }

    if (!type.isUndefined(value['_module.endpointId'])) {
      const endpointName = value['_module.endpointId'];
      if (!type.isString(endpointName)) {
        throw new ConfigError('_module.endpointId requires a string endpoint name.');
      }
      const manifest = moduleEntry.manifest;
      if (!(manifest.api ?? []).some((e) => e.id === endpointName)) {
        throw new ConfigError(
          `Module "${moduleEntry.id}" does not export endpoint "${endpointName}".`
        );
      }
      return `${moduleEntry.id}/${endpointName}`;
    }

    if (!type.isUndefined(value['_module.id'])) {
      return moduleEntry.id;
    }

    return value;
  };

  return serializer.copy(input, { reviver });
}

export default resolveModuleOperators;
export { scopeMenuItemIds };
