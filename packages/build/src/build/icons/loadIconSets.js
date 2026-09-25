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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import createLucideIconLayer from './createLucideIconLayer.js';
import { semanticNamePattern } from './iconNamePatterns.js';
import importPluginModule from '../writePluginImports/importPluginModule.js';

function validateSetDefinition({ definition, packageName, setId }) {
  const source = `Icon set "${setId}" in "${packageName}/iconSets"`;
  if (!type.isObject(definition)) {
    throw new ConfigError(
      `Plugin "${packageName}" declares icon set "${setId}" in its types, but "${packageName}/iconSets" does not export it.`
    );
  }
  if (!type.isFunction(definition.listIcons) || !type.isFunction(definition.loadIcons)) {
    throw new ConfigError(`${source} must define "listIcons" and "loadIcons" functions.`);
  }
  if (!type.isNone(definition.attrs) && !type.isObject(definition.attrs)) {
    throw new ConfigError(`${source} "attrs" must be an object.`);
  }
  // Stroke width is an app setting (theme.icons.strokeWidth); a set must not
  // override the app's choice.
  if (type.isObject(definition.attrs) && Object.hasOwn(definition.attrs, 'strokeWidth')) {
    throw new ConfigError(`${source} "attrs" may not set "strokeWidth".`);
  }
  if (!type.isNone(definition.semantic) && !type.isObject(definition.semantic)) {
    throw new ConfigError(`${source} "semantic" must be an object.`);
  }
}

// Sets are layered: the built-in Lucide data is the bottom layer of "lucide",
// and every plugin that declares a set id adds a layer on top, in plugins:
// order (typesMap.iconSets keeps that order).
async function loadIconSets({ context }) {
  const sets = { lucide: [createLucideIconLayer()] };
  for (const [setId, layers] of Object.entries(context.typesMap.iconSets)) {
    if (!semanticNamePattern.test(setId)) {
      throw new ConfigError(
        `Icon set id "${setId}" should be lowercase kebab-case, like "lucide" or "react-icons".`
      );
    }
    sets[setId] = sets[setId] ?? [];
    for (const { package: packageName, version } of layers) {
      const iconSetsModule = await importPluginModule({
        context,
        specifier: `${packageName}/iconSets`,
      });
      if (type.isUndefined(iconSetsModule)) {
        throw new ConfigError(
          `Plugin "${packageName}" declares icon set "${setId}" in its types, but "${packageName}/iconSets" could not be imported.`
        );
      }
      const definition = iconSetsModule.default?.[setId];
      validateSetDefinition({ definition, packageName, setId });
      const names = await definition.listIcons();
      sets[setId].push({
        attrs: definition.attrs,
        loadIcons: definition.loadIcons,
        names: new Set(names),
        package: packageName,
        semantic: definition.semantic,
        version,
      });
    }
  }
  return sets;
}

export default loadIconSets;
