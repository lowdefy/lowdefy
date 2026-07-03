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

import { getPlaceholderId } from './deferredRegistry.js';

function describeRef(refDef) {
  const parts = [];
  if (refDef.module) parts.push(`module: "${refDef.module}"`);
  if (refDef.component) parts.push(`component: "${refDef.component}"`);
  if (refDef.menu) parts.push(`menu: "${refDef.menu}"`);
  if (refDef.page) parts.push(`page: "${refDef.page}"`);
  if (refDef.connection) parts.push(`connection: "${refDef.connection}"`);
  if (refDef.api) parts.push(`api: "${refDef.api}"`);
  return `_ref { ${parts.join(', ')} }`;
}

async function getModuleRefContent({ context, refDef, referencedFrom, walkCtx, configKey }) {
  const rawName = refDef.module;
  let entryId;

  if (walkCtx?.moduleDependencies && rawName in walkCtx.moduleDependencies) {
    entryId = walkCtx.moduleDependencies[rawName];
  } else {
    entryId = rawName;
  }

  const moduleEntry = context.modules[entryId];

  if (!moduleEntry) {
    throw new ConfigError(
      `${describeRef(refDef)} references module "${rawName}" but no module with that entry id was registered` +
        (entryId !== rawName
          ? ` ("${rawName}" was mapped to "${entryId}" via dependency wiring).`
          : '.'),
      { configKey }
    );
  }

  const manifest = moduleEntry.manifest;

  // Cross-module _ref is limited to component and menu.
  // Reject page, connection, api with a clear error pointing to the ID operators.
  if (refDef.page || refDef.connection || refDef.api) {
    const refType = refDef.page ? 'page' : refDef.connection ? 'connection' : 'api';
    const operator = refDef.page
      ? '_module.pageId'
      : refDef.connection
        ? '_module.connectionId'
        : '_module.endpointId';
    throw new ConfigError(
      `Cross-module _ref does not support "${refType}". ` +
        `Use ${operator}: { id: "${refDef[refType]}", module: "${rawName}" } instead.`,
      { configKey }
    );
  }

  const exportTypes = ['component', 'menu'];
  const exportType = exportTypes.find((t) => refDef[t]) ?? null;

  if (!exportType) {
    throw new ConfigError('Module _ref requires "component" or "menu" property.', { configKey });
  }

  const exportName = refDef[exportType];
  const manifestArray =
    {
      component: manifest.components,
      menu: manifest.menus,
    }[exportType] ?? [];

  const entry = manifestArray.find((item) => item.id === exportName);

  if (!entry) {
    const availableIds = manifestArray.map((item) => item.id);
    const available =
      availableIds.length > 0
        ? ` Available ${exportType}s: ${availableIds.join(', ')}.`
        : ` The module defines no ${exportType}s.`;
    throw new ConfigError(`Module "${entryId}" has no ${exportType} "${exportName}".${available}`, {
      configKey,
    });
  }

  const content = exportType === 'component' ? entry.component : entry.links;

  if (!content) {
    throw new ConfigError(
      `The ${exportType} "${exportName}" in module "${entryId}" is empty.`,
      { configKey }
    );
  }

  // Component bodies live in the deferred-record registry — the manifest holds
  // a placeholder. Return the record id; consumption dereferences it and walks
  // a clone under the record's env. (Menus still return live links until they
  // become records; scalar legacy bodies fall through as live content.)
  const recordId = getPlaceholderId(content);
  if (recordId !== undefined) {
    return { recordId, entryId };
  }

  return { content, entryId };
}

export default getModuleRefContent;
