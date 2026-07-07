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

import enUS from 'antd-mobile/es/locales/en-US';

// Loader map for @lowdefy/client's useLocale — keyed by the antd-mobile
// locale codes; unsupported active locales fall back to en-US in App.jsx.
// en-US is bundled eagerly as the synchronous initial value and fallback.
const antdMobileLocaleLoaders = {
  'da-DK': () => import('antd-mobile/es/locales/da-DK'),
  'de-DE': () => import('antd-mobile/es/locales/de-DE'),
  'en-US': () => Promise.resolve({ default: enUS }),
  'es-ES': () => import('antd-mobile/es/locales/es-ES'),
  'fa-IR': () => import('antd-mobile/es/locales/fa-IR'),
  'fr-FR': () => import('antd-mobile/es/locales/fr-FR'),
  'id-ID': () => import('antd-mobile/es/locales/id-ID'),
  'it-IT': () => import('antd-mobile/es/locales/it-IT'),
  'ja-JP': () => import('antd-mobile/es/locales/ja-JP'),
  'ko-KR': () => import('antd-mobile/es/locales/ko-KR'),
  'nl-NL': () => import('antd-mobile/es/locales/nl-NL'),
  'pt-BR': () => import('antd-mobile/es/locales/pt-BR'),
  'ru-RU': () => import('antd-mobile/es/locales/ru-RU'),
  'th-TH': () => import('antd-mobile/es/locales/th-TH'),
  'tr-TR': () => import('antd-mobile/es/locales/tr-TR'),
  'vi-VN': () => import('antd-mobile/es/locales/vi-VN'),
  'zh-CN': () => import('antd-mobile/es/locales/zh-CN'),
  'zh-HK': () => import('antd-mobile/es/locales/zh-HK'),
  'zh-TW': () => import('antd-mobile/es/locales/zh-TW'),
};

export { enUS };

export default antdMobileLocaleLoaders;
