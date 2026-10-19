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

// Tableau-10 categorical palette — mid-saturation hues that read on both the
// light and dark canvas.
const PALETTE = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
];

// djb2 — tiny, deterministic string hash for stable palette assignment.
function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Resolve the pill color for a tag option. An explicit option.color wins;
// otherwise a hash of the option value picks a stable palette color so a given
// value keeps the same hue on every render. Returns null in single-accent mode
// (colored: false) so the CSS primary look takes over.
function getTagColor({ option, colored }) {
  if (option.color) return option.color;
  if (!colored) return null;
  return PALETTE[hashString(`${option.value}`) % PALETTE.length];
}

export default getTagColor;
