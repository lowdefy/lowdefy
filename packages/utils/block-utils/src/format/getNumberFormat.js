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

// Building an Intl.NumberFormat is far slower than formatting with one, and grids format
// thousands of cells with a handful of configs, so formatters are kept by locale and options.
const formatters = new Map();
const MAX_FORMATTERS = 500;

function getNumberFormat({ locale, options }) {
  const key = JSON.stringify([locale ?? null, options]);
  let formatter = formatters.get(key);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale, options);
    if (formatters.size >= MAX_FORMATTERS) formatters.clear();
    formatters.set(key, formatter);
  }
  return formatter;
}

export default getNumberFormat;
