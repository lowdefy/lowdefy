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

import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

async function writeI18n({ components, context }) {
  const i18n = components.config?.i18n;
  if (type.isNone(i18n)) {
    await context.writeBuildArtifact('i18n.json', serializer.serializeToString({}));
    return;
  }
  if (!type.isObject(i18n)) {
    throw new ConfigError('App "config.i18n" should be an object.', {
      configKey: i18n?.['~k'],
    });
  }
  if (type.isNone(i18n.defaultLocale) || !type.isString(i18n.defaultLocale)) {
    throw new ConfigError('App "config.i18n" requires a string "defaultLocale".', {
      configKey: i18n['~k'],
    });
  }
  if (!type.isArray(i18n.locales) || i18n.locales.length === 0) {
    throw new ConfigError('App "config.i18n" requires a non-empty "locales" array.', {
      configKey: i18n['~k'],
    });
  }
  const codes = new Set();
  i18n.locales.forEach((locale) => {
    if (!type.isObject(locale) || !type.isString(locale.code)) {
      throw new ConfigError('App "config.i18n.locales[]" requires a string "code".', {
        configKey: locale?.['~k'] ?? i18n['~k'],
      });
    }
    if (codes.has(locale.code)) {
      throw new ConfigError(`Duplicate locale code "${locale.code}" in "config.i18n.locales".`, {
        configKey: locale['~k'],
      });
    }
    codes.add(locale.code);
  });
  if (!codes.has(i18n.defaultLocale)) {
    throw new ConfigError(
      `App "config.i18n.defaultLocale" "${i18n.defaultLocale}" must be present in "locales".`,
      { configKey: i18n['~k'] }
    );
  }
  const fallbackLocale = i18n.fallbackLocale ?? i18n.defaultLocale;
  if (!codes.has(fallbackLocale)) {
    throw new ConfigError(
      `App "config.i18n.fallbackLocale" "${fallbackLocale}" must be present in "locales".`,
      { configKey: i18n['~k'] }
    );
  }
  const messages = i18n.messages ?? {};
  if (!type.isObject(messages)) {
    throw new ConfigError('App "config.i18n.messages" should be an object.', {
      configKey: i18n['~k'],
    });
  }
  Object.keys(messages).forEach((code) => {
    if (!codes.has(code)) {
      context.handleWarning(
        new ConfigWarning(
          `App "config.i18n.messages.${code}" references a locale not declared in "locales".`,
          { configKey: i18n['~k'] }
        )
      );
    }
  });
  codes.forEach((code) => {
    if (type.isNone(messages[code])) {
      context.handleWarning(
        new ConfigWarning(
          `App "config.i18n" has no messages for locale "${code}". Falls back to "${fallbackLocale}".`,
          { configKey: i18n['~k'] }
        )
      );
    }
  });
  const artifact = {
    defaultLocale: i18n.defaultLocale,
    fallbackLocale,
    locales: i18n.locales.map((locale) => ({
      code: locale.code,
      label: locale.label,
      antd: locale.antd,
      dayjs: locale.dayjs,
    })),
    messages,
  };
  await context.writeBuildArtifact('i18n.json', serializer.serializeToString(artifact));
}

export default writeI18n;
