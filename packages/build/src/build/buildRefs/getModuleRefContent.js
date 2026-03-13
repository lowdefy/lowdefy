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

async function getModuleRefContent({ context, refDef, referencedFrom, walkCtx }) {
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
      `Module entry "${rawName}" not found.` +
        (entryId !== rawName
          ? ` ("${rawName}" was mapped to "${entryId}" via dependency wiring.)`
          : '')
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
        `Use ${operator}: { id: "${refDef[refType]}", module: "${rawName}" } instead.`
    );
  }

  const exportTypes = ['component', 'menu'];
  const exportType = exportTypes.find((t) => refDef[t]) ?? null;

  if (!exportType) {
    throw new ConfigError(
      'Module _ref requires "component" or "menu" property.'
    );
  }

  const exportName = refDef[exportType];
  const manifestArray =
    {
      component: manifest.components,
      menu: manifest.menus,
    }[exportType] ?? [];

  let content;
  if (exportType === 'component') {
    content = manifestArray.find((item) => item.id === exportName)?.component;
  } else if (exportType === 'menu') {
    content = manifestArray.find((item) => item.id === exportName)?.links;
  }

  if (!content) {
    throw new ConfigError(
      `Module "${entryId}" does not export ${exportType} "${exportName}".`
    );
  }

  return { content, entryId };
}

export default getModuleRefContent;
