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

// The first device locale the app supports, by exact code, then by language.
function pickBest({ candidates, supported }) {
  for (const candidate of candidates) {
    if (supported.includes(candidate)) return candidate;
    const language = candidate.split('-')[0];
    const match = supported.find((code) => code.split('-')[0] === language);
    if (match) return match;
  }
  return undefined;
}

/**
 * The app's active locale, as the web client picks it (useLocale): the person's choice (SetLocale)
 * when the app supports it, else the device's locale the app supports best, else the app's
 * default. Undefined for an app without i18n.
 *
 * @param {Object} params
 * @param {string[]} params.deviceLocales The device's locales, preferred first.
 * @param {Object} params.i18n The app's i18n config: `{ defaultLocale, locales }`.
 * @param {string} params.preference A locale code, or 'auto'.
 */
function resolveActiveLocale({ deviceLocales, i18n, preference }) {
  const supported = (i18n.locales ?? []).map((locale) => locale.code);
  if (preference !== 'auto' && supported.includes(preference)) {
    return preference;
  }
  return pickBest({ candidates: deviceLocales, supported }) ?? i18n.defaultLocale;
}

export default resolveActiveLocale;
