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

// A language tag: a 2–3 letter language and optional subtags ("en", "en-US",
// "zh-Hant-TW"). Intl throws on anything else, such as "en_US".
const LANGUAGE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;

// The app's active locale that useLocale publishes, for formatting HTML dates
// and numbers. Undefined (the browser's locale) when the app has no i18n or the
// code is not a language tag Intl accepts.
function getActiveLocale(window) {
  const locale = window.__lowdefy_locale;
  if (!type.isString(locale) || !LANGUAGE_TAG.test(locale)) return undefined;
  return locale;
}

export default getActiveLocale;
