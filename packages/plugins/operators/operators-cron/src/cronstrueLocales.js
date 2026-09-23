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

// cronstrue does not export its locale list, and silently falls back to English for an unknown
// locale, so the codes are listed here. A test checks this list against the installed cronstrue.
const cronstrueLocales = [
  'af',
  'ar',
  'az',
  'be',
  'bg',
  'ca',
  'cs',
  'da',
  'de',
  'en',
  'es',
  'fa',
  'fi',
  'fr',
  'he',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'my',
  'nb',
  'nl',
  'nn',
  'pl',
  'pt_BR',
  'pt_PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sv',
  'sw',
  'tg',
  'th',
  'tr',
  'uk',
  'vi',
  'zh_CN',
  'zh_TW',
];

export default cronstrueLocales;
