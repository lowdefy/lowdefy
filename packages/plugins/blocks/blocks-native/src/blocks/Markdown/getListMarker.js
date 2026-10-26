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

const BULLETS = ['•', '◦', '▪'];

function toAlpha(number) {
  let rest = number;
  let letters = '';
  while (rest > 0) {
    const digit = (rest - 1) % 26;
    letters = String.fromCharCode(97 + digit) + letters;
    rest = Math.floor((rest - 1) / 26);
  }
  return letters;
}

const ROMAN = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
];

function toRoman(number) {
  let rest = number;
  let numeral = '';
  ROMAN.forEach(([value, letters]) => {
    while (rest >= value) {
      numeral += letters;
      rest -= value;
    }
  });
  return numeral;
}

/**
 * A list item's marker, by how deep its list sits, as Notes and Pages mark nested lists: bullets
 * go •, ◦, ▪ and numbers 1., a., i., each repeating its last style deeper down.
 *
 * @param {Object} params
 * @param {number} params.depth 0 for a top-level list.
 * @param {number} params.number The item's number in an ordered list (its start plus its index).
 * @param {boolean} params.ordered
 * @returns {string}
 */
function getListMarker({ depth, number, ordered }) {
  if (!ordered) {
    return BULLETS[Math.min(depth, BULLETS.length - 1)];
  }
  if (depth === 0 || number < 1) {
    return `${number}.`;
  }
  if (depth === 1) {
    return `${toAlpha(number)}.`;
  }
  return `${toRoman(number)}.`;
}

export default getListMarker;
