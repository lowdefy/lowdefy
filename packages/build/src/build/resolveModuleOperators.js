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

function resolveModuleOperators({ input, moduleEntry, context }) {
  const reviver = (_, value) => {
    if (!type.isObject(value)) return value;

    const keys = Object.keys(value).filter((k) => !k.startsWith('~'));
    if (keys.length !== 1) return value;

    if (!type.isUndefined(value['_module.pageId'])) {
      const arg = value['_module.pageId'];

      if (type.isString(arg)) {
        const manifest = moduleEntry.manifest;
        if (!(manifest.pages ?? []).some((p) => p.id === arg)) {
          throw new ConfigError(
            `Module "${moduleEntry.id}" does not export page "${arg}".`
          );
        }
        return `${moduleEntry.id}/${arg}`;
      }

      if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
        const targetEntry = resolveDepTarget({ moduleEntry, depName: arg.module, context });
        const targetExports = targetEntry.exports ?? {};
        if (!(targetExports.pages ?? []).some((p) => p.id === arg.id)) {
          throw new ConfigError(
            `Module "${moduleEntry.id}" references page "${arg.id}" ` +
              `from dependency "${arg.module}" (entry "${targetEntry.id}"), ` +
              `but that module does not export page "${arg.id}".`
          );
        }
        return `${targetEntry.id}/${arg.id}`;
      }

      throw new ConfigError('_module.pageId requires a string or object { id, module }.');
    }

    if (!type.isUndefined(value['_module.connectionId'])) {
      const arg = value['_module.connectionId'];

      if (type.isString(arg)) {
        const manifest = moduleEntry.manifest;
        if (!(manifest.connections ?? []).some((c) => c.id === arg)) {
          throw new ConfigError(
            `Module "${moduleEntry.id}" does not export connection "${arg}".`
          );
        }
        const remapping = moduleEntry.connections ?? {};
        if (remapping[arg]) {
          return remapping[arg];
        }
        return `${moduleEntry.id}/${arg}`;
      }

      if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
        const targetEntry = resolveDepTarget({ moduleEntry, depName: arg.module, context });
        const targetExports = targetEntry.exports ?? {};
        if (!(targetExports.connections ?? []).some((c) => c.id === arg.id)) {
          throw new ConfigError(
            `Module "${moduleEntry.id}" references connection "${arg.id}" ` +
              `from dependency "${arg.module}" (entry "${targetEntry.id}"), ` +
              `but that module does not export connection "${arg.id}".`
          );
        }
        const targetRemapping = targetEntry.connections ?? {};
        if (targetRemapping[arg.id]) {
          return targetRemapping[arg.id];
        }
        return `${targetEntry.id}/${arg.id}`;
      }

      throw new ConfigError(
        '_module.connectionId requires a string or object { id, module }.'
      );
    }

    if (!type.isUndefined(value['_module.endpointId'])) {
      const arg = value['_module.endpointId'];

      if (type.isString(arg)) {
        const manifest = moduleEntry.manifest;
        if (!(manifest.api ?? []).some((e) => e.id === arg)) {
          throw new ConfigError(
            `Module "${moduleEntry.id}" does not export endpoint "${arg}".`
          );
        }
        return `${moduleEntry.id}/${arg}`;
      }

      if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
        const targetEntry = resolveDepTarget({ moduleEntry, depName: arg.module, context });
        const targetExports = targetEntry.exports ?? {};
        if (!(targetExports.api ?? []).some((e) => e.id === arg.id)) {
          throw new ConfigError(
            `Module "${moduleEntry.id}" references endpoint "${arg.id}" ` +
              `from dependency "${arg.module}" (entry "${targetEntry.id}"), ` +
              `but that module does not export endpoint "${arg.id}".`
          );
        }
        return `${targetEntry.id}/${arg.id}`;
      }

      throw new ConfigError(
        '_module.endpointId requires a string or object { id, module }.'
      );
    }

    if (!type.isUndefined(value['_module.id'])) {
      const arg = value['_module.id'];

      if (!type.isObject(arg)) {
        return moduleEntry.id;
      }

      if (type.isString(arg.module)) {
        const targetEntry = resolveDepTarget({ moduleEntry, depName: arg.module, context });
        return targetEntry.id;
      }

      throw new ConfigError('_module.id requires a truthy value or object { module }.');
    }

    return value;
  };

  return serializer.copy(input, { reviver });
}

export default resolveModuleOperators;
export { resolveDepTarget, scopeMenuItemIds };
