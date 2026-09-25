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

import { createRequire } from 'module';
import path from 'path';

import { ConfigError } from '@lowdefy/errors';

import findSimilarString from '../../utils/findSimilarString.js';
import { getIconNamePackages } from './collectIconNames.js';

const aliasNameRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

// theme.icons.aliases is new, explicit config: a target that names no icon is a
// mistake in that config, so it fails the build rather than warning.
function validateIconAliases({ aliases, configKey, context }) {
  const serverRequire = createRequire(path.join(context.directories.server, 'package.json'));
  const moduleCache = {};

  function loadIconPackage(iconPackage) {
    if (!Object.hasOwn(moduleCache, iconPackage)) {
      try {
        moduleCache[iconPackage] = serverRequire(iconPackage);
      } catch {
        // Same as validateIconImports: without the package installed the name
        // cannot be checked here.
        moduleCache[iconPackage] = null;
      }
    }
    return moduleCache[iconPackage];
  }

  Object.entries(aliases).forEach(([name, target]) => {
    // Every react-icons name starts with an uppercase pack prefix, so a
    // lowercase kebab-case alias can never shadow one.
    if (!aliasNameRegex.test(name)) {
      throw new ConfigError(
        `Icon alias "${name}" should be lowercase kebab-case, like "edit" or "external-link".`,
        { configKey }
      );
    }
    const targetPackages = getIconNamePackages(target);
    if (targetPackages.length === 0) {
      throw new ConfigError(
        `Icon alias "${name}" targets "${target}", which is not a react-icons name. Alias targets are react-icons export names like "LuPencil".`,
        { configKey }
      );
    }
    const modules = targetPackages.map(loadIconPackage);
    if (modules.includes(null)) return;
    if (modules.some((iconModule) => iconModule[target])) return;
    let message = `Icon alias "${name}" targets "${target}", which is not a react-icons icon.`;
    const suggestion = findSimilarString({
      input: target,
      candidates: modules.flatMap((iconModule) => Object.keys(iconModule)),
      maxDistance: Math.max(3, Math.ceil(target.length * 0.4)),
    });
    if (suggestion) {
      message += ` Did you mean "${suggestion}"?`;
    }
    throw new ConfigError(message, { configKey });
  });
}

export default validateIconAliases;
