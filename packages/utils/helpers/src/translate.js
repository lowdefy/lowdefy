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

import { IntlMessageFormat } from 'intl-messageformat';

import builtinMessages from './builtinMessages.js';
import type from './type.js';

function resolveMessage({ key, active, fallback, messages }) {
  if (active && messages[active]?.[key] != null) return messages[active][key];
  if (fallback && messages[fallback]?.[key] != null) return messages[fallback][key];
  if (builtinMessages[key] != null) return builtinMessages[key];
  return key;
}

function translate({ key, values, locale, i18n }) {
  if (!type.isString(key)) {
    throw new Error('translate requires a string "key".');
  }
  const active = locale ?? i18n?.active ?? i18n?.defaultLocale;
  const fallback = i18n?.fallbackLocale ?? i18n?.defaultLocale;
  const messages = i18n?.messages ?? {};
  const message = resolveMessage({ key, active, fallback, messages });
  if (type.isNone(values)) return message;
  if (!type.isObject(values)) {
    throw new Error('translate "values" must be an object.');
  }
  return new IntlMessageFormat(message, active).format(values);
}

export default translate;
