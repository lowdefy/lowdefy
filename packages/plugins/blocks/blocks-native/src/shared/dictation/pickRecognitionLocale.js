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

function normalise(locale) {
  return locale.replace(/_/g, '-').toLowerCase();
}

function languageOf(locale) {
  return normalise(locale).split('-')[0];
}

/**
 * The installed recognition locale to dictate in for the phone's language: the phone's own
 * locale when it is installed, else another installed locale of the same language (en-US for a
 * phone set to en-ZA), else null. Locales compare without case, and with "_" read as "-".
 *
 * @param {Object} params
 * @param {string} params.lang The phone's locale, such as "en-ZA".
 * @param {string[]} params.locales The locales the recogniser has installed.
 * @returns {string|null}
 */
function pickRecognitionLocale({ lang, locales }) {
  const exact = locales.find((locale) => normalise(locale) === normalise(lang));
  if (exact !== undefined) {
    return exact;
  }
  return locales.find((locale) => languageOf(locale) === languageOf(lang)) ?? null;
}

export default pickRecognitionLocale;
