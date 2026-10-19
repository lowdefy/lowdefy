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

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];

// A byte count in the largest unit it reaches, base 1000 as the SI unit names
// mean. Bytes use the long unit ("12 bytes"), larger units the short one
// ("1.5 kB"), as file managers show them.
function formatBytes({ value, decimals, locale }) {
  let scaled = Math.abs(value);
  let index = 0;
  while (scaled >= 1000 && index < UNITS.length - 1) {
    scaled /= 1000;
    index += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[index],
    unitDisplay: index === 0 ? 'long' : 'short',
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 1,
  }).format(Math.sign(value) * scaled);
}

export default formatBytes;
