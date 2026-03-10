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

async function getModuleRefContent({ context, refDef }) {
  const entryId = refDef.module;
  const moduleEntry = context.modules[entryId];

  if (!moduleEntry) {
    throw new ConfigError(`Module entry "${entryId}" not found.`);
  }

  const manifest = moduleEntry.manifest;

  const exportTypes = ['component', 'menu', 'page', 'connection', 'api'];
  const exportType = exportTypes.find((t) => refDef[t]) ?? null;

  if (!exportType) {
    throw new ConfigError(
      'Module _ref requires "component", "menu", "page", "connection", or "api" property.'
    );
  }

  const exportName = refDef[exportType];
  const manifestArray =
    {
      component: manifest.components,
      menu: manifest.menus,
      page: manifest.pages,
      connection: manifest.connections,
      api: manifest.api,
    }[exportType] ?? [];

  let content;
  if (exportType === 'component') {
    content = manifestArray.find((item) => item.id === exportName)?.component;
  } else if (exportType === 'menu') {
    content = manifestArray.find((item) => item.id === exportName)?.links;
  } else {
    content = manifestArray.find((item) => item.id === exportName);
  }

  if (!content) {
    throw new ConfigError(
      `Module "${entryId}" does not export ${exportType} "${exportName}".`
    );
  }

  return content;
}

export default getModuleRefContent;
