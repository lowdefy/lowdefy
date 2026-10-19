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

// The schema pass only warns, and the icon pipeline reads these values
// directly, so a wrong type stops the build here.
function validateIconThemeShape({ iconsConfig }) {
  if (type.isNone(iconsConfig)) {
    return;
  }
  const configKey = iconsConfig['~k'];
  if (!type.isObject(iconsConfig)) {
    throw new ConfigError('App "theme.icons" should be an object.', { configKey });
  }
  if (!type.isNone(iconsConfig.set) && !type.isString(iconsConfig.set)) {
    throw new ConfigError(
      `App "theme.icons.set" should be an icon set id, like "lucide". Received ${JSON.stringify(
        iconsConfig.set
      )}.`,
      { configKey }
    );
  }
  if (
    !type.isNone(iconsConfig.size) &&
    !type.isString(iconsConfig.size) &&
    !type.isNumber(iconsConfig.size)
  ) {
    throw new ConfigError(
      `App "theme.icons.size" should be a string or a number. Received ${JSON.stringify(
        iconsConfig.size
      )}.`,
      { configKey }
    );
  }
  if (
    !type.isNone(iconsConfig.strokeWidth) &&
    (!type.isNumber(iconsConfig.strokeWidth) || iconsConfig.strokeWidth <= 0)
  ) {
    throw new ConfigError(
      `App "theme.icons.strokeWidth" should be a number greater than 0. Received ${JSON.stringify(
        iconsConfig.strokeWidth
      )}.`,
      { configKey }
    );
  }
  if (!type.isNone(iconsConfig.nonScalingStroke) && !type.isBoolean(iconsConfig.nonScalingStroke)) {
    throw new ConfigError(
      `App "theme.icons.nonScalingStroke" should be a boolean. Received ${JSON.stringify(
        iconsConfig.nonScalingStroke
      )}.`,
      { configKey }
    );
  }
  if (!type.isNone(iconsConfig.aliases)) {
    if (!type.isObject(iconsConfig.aliases)) {
      throw new ConfigError('App "theme.icons.aliases" should be an object.', { configKey });
    }
    Object.entries(iconsConfig.aliases).forEach(([name, target]) => {
      if (!type.isString(target)) {
        throw new ConfigError(
          `Icon alias "${name}" should target an icon name. Received ${JSON.stringify(target)}.`,
          { configKey: iconsConfig.aliases['~k'] ?? configKey }
        );
      }
    });
  }
  if (!type.isNone(iconsConfig.include)) {
    if (!type.isArray(iconsConfig.include) || !iconsConfig.include.every(type.isString)) {
      throw new ConfigError('App "theme.icons.include" should be an array of icon names.', {
        configKey,
      });
    }
  }
}

export default validateIconThemeShape;
