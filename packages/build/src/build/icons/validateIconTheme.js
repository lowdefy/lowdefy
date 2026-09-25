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

import collectExceptions from '../../utils/collectExceptions.js';
import createUnresolvedIconError from './createUnresolvedIconError.js';
import { semanticNamePattern } from './iconNamePatterns.js';
import resolveIconName from './resolveIconName.js';

// theme.icons is explicit icon config, so every name in it is an icon
// position: a set that is not installed, an alias target or an include entry
// that names nothing fails the build.
function validateIconTheme({ iconsConfig, icons, context }) {
  if (type.isNone(iconsConfig)) {
    return;
  }
  const configKey = iconsConfig['~k'];

  if (!Object.hasOwn(icons.sets, icons.defaultSet)) {
    const installed = Object.keys(icons.sets)
      .map((setId) => `"${setId}"`)
      .join(', ');
    collectExceptions(
      context,
      new ConfigError(
        `App "theme.icons.set" is "${icons.defaultSet}", but no installed plugin declares that icon set. Installed icon sets: ${installed}.`,
        { configKey }
      )
    );
  }

  const aliases = iconsConfig.aliases ?? {};
  const aliasesKey = aliases['~k'] ?? configKey;
  Object.entries(aliases).forEach(([name, target]) => {
    if (!semanticNamePattern.test(name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Icon alias "${name}" should be lowercase kebab-case, like "edit" or "external-link".`,
          { configKey: aliasesKey }
        )
      );
      return;
    }
    // One hop: a target that is itself a semantic name would need resolving
    // in turn, and could form a cycle.
    if (semanticNamePattern.test(target)) {
      collectExceptions(
        context,
        new ConfigError(
          `Icon alias "${name}" targets "${target}", which is a semantic name. Alias targets are set names like "Pencil" or qualified names like "lucide:Pencil".`,
          { configKey: aliasesKey }
        )
      );
      return;
    }
    if (resolveIconName({ name: target, ...icons }) === null) {
      collectExceptions(
        context,
        createUnresolvedIconError({ name: target, icons, configKey: aliasesKey })
      );
    }
  });

  (iconsConfig.include ?? []).forEach((name) => {
    if (resolveIconName({ name, ...icons }) === null) {
      collectExceptions(
        context,
        createUnresolvedIconError({
          name,
          icons,
          configKey: iconsConfig.include['~k'] ?? configKey,
        })
      );
    }
  });
}

export default validateIconTheme;
