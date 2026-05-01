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
import { type } from '@lowdefy/helpers';

function _t({ params, i18n }) {
  let key;
  let values;
  let localeOverride;
  if (type.isString(params)) {
    key = params;
  } else if (type.isObject(params)) {
    key = params.key;
    values = params.values;
    localeOverride = params.locale;
  } else {
    throw new Error(
      '_t takes a string key or an object { key, values, locale } — received ' +
        JSON.stringify(params)
    );
  }
  if (!type.isString(key)) {
    throw new Error('_t requires a string "key".');
  }
  const active = localeOverride ?? i18n?.active ?? i18n?.defaultLocale;
  const fallback = i18n?.fallbackLocale ?? i18n?.defaultLocale;
  const messages = i18n?.messages ?? {};
  const message =
    messages[active]?.[key] ?? (fallback ? messages[fallback]?.[key] : undefined) ?? key;
  if (type.isNone(values)) return message;
  if (!type.isObject(values)) {
    throw new Error('_t "values" must be an object.');
  }
  return new IntlMessageFormat(message, active).format(values);
}

_t.dynamic = true;

export default _t;
