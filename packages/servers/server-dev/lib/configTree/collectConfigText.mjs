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

import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { normaliseClickText } from '@lowdefy/node-utils';

// Build markers: their values are key and reference ids, not text the app
// shows.
const MARKER_KEYS = new Set(['~k', '~r', '~l', '~ignoreBuildChecks']);
const ANTD_LOCALE_NAME = /^[A-Za-z]{2,3}(_[A-Za-z0-9]+)*$/;

// Strings only: a number leaf is not config text, so a page size of 42 never
// resolves a grid cell showing "42".
function addStringLeaves({ value, texts }) {
  if (type.isString(value)) {
    const text = normaliseClickText(value);
    if (!type.isNone(text)) texts.add(text);
    return;
  }
  if (type.isArray(value)) {
    value.forEach((item) => addStringLeaves({ value: item, texts }));
    return;
  }
  if (type.isObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (MARKER_KEYS.has(key)) return;
      addStringLeaves({ value: item, texts });
    });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listPageArtifacts({ buildDirectory }) {
  const pagesDirectory = path.join(buildDirectory, 'pages');
  if (!fs.existsSync(pagesDirectory)) return [];
  return fs
    .readdirSync(pagesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(pagesDirectory, entry.name))
    .sort();
}

// antd shows its own strings (OK, Cancel, pagination) in the locale the app
// declares for it; an app with no i18n, or a locale with no antd name, gets
// antd's default, en_US.
function listAntdLocales({ i18n }) {
  const locales = i18n.locales ?? [];
  if (locales.length === 0) return ['en_US'];
  const names = locales.map((locale) =>
    type.isString(locale.antd) && ANTD_LOCALE_NAME.test(locale.antd) ? locale.antd : 'en_US'
  );
  return [...new Set(names)].sort();
}

async function importAntdLocale(name) {
  const module = await import(`antd/locale/${name}.js`);
  return module.default?.default ?? module.default ?? module;
}

// The app's config text set: every string an element of this app can show
// that comes from the repository, never from data. Read after a full build
// from its artifacts: every page's string leaves (operator arguments
// included, so both branches of an _if count), menus.json, every locale's
// messages in i18n.json, every plugin's default messages for every locale it
// ships (i18n.json keeps only declared locales), and antd's locale strings.
// Returns a sorted array of distinct strings, normalised as clicked text is.
async function collectConfigText({ buildDirectory, messagesMap }) {
  const texts = new Set();
  listPageArtifacts({ buildDirectory }).forEach((filePath) => {
    addStringLeaves({ value: readJson(filePath), texts });
  });
  addStringLeaves({ value: readJson(path.join(buildDirectory, 'menus.json')), texts });
  const i18n = readJson(path.join(buildDirectory, 'i18n.json'));
  addStringLeaves({ value: i18n.messages ?? {}, texts });
  (i18n.locales ?? []).forEach((locale) => addStringLeaves({ value: locale.label, texts }));
  addStringLeaves({ value: messagesMap, texts });
  for (const name of listAntdLocales({ i18n })) {
    addStringLeaves({ value: await importAntdLocale(name), texts });
  }
  return [...texts].sort();
}

export default collectConfigText;
