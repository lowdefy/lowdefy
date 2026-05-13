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

const TYPE_TO_TOKEN = {
  year: 'YYYY',
  month: 'MM',
  day: 'DD',
  hour: 'HH',
  minute: 'mm',
  second: 'ss',
};

const OPTIONS = {
  date: { year: 'numeric', month: '2-digit', day: '2-digit' },
  datetime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  time: { hour: '2-digit', minute: '2-digit', hour12: false },
  month: { year: 'numeric', month: '2-digit' },
};

// Fixed reference instant — only the locale's literal separators and digit ordering matter,
// not the values themselves. Using a constant keeps the result deterministic.
const REFERENCE = new Date(Date.UTC(2024, 0, 2, 15, 30, 45));

function getLocaleDateFormat(locale, style = 'date') {
  if (typeof locale !== 'string' || locale === '') return null;
  const options = OPTIONS[style];
  if (!options) return null;
  try {
    const parts = new Intl.DateTimeFormat(locale, options).formatToParts(REFERENCE);
    return parts.map((p) => TYPE_TO_TOKEN[p.type] ?? p.value).join('');
  } catch {
    return null;
  }
}

export default getLocaleDateFormat;
