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

// Constructing an Intl.NumberFormat costs far more than formatting with one (about 7 us against
// under 1 us), and tables format the same few column configs for every row they export or search.
// Formatters are kept by locale and options; the set is small and bounded by the app's configs,
// the cap only guards against configs built per value.
const MAX_FORMATTERS = 200;
const formatters = new Map();

function getNumberFormat({ locale, options }) {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    if (formatters.size >= MAX_FORMATTERS) formatters.clear();
    formatter = new Intl.NumberFormat(locale, options);
    formatters.set(key, formatter);
  }
  return formatter;
}

export default getNumberFormat;
