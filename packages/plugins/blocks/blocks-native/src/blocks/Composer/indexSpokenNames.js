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

import { type } from '@lowdefy/helpers';

/**
 * A name as spoken words: lower case, curly apostrophes made straight, split on whitespace.
 *
 * @param {string} text
 * @returns {string[]}
 */
function toSpokenWords(text) {
  return text
    .toLocaleLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/\s+/)
    .filter((word) => word !== '');
}

/**
 * The names spoken mentions are matched against: each person who sees the record, with their
 * name as spoken words and as one string.
 *
 * @param {Object} params
 * @param {Array<{ value: string, label: string, sees?: boolean }>} [params.people]
 * @returns {Array<{ person: Object, words: string[], full: string }>}
 */
function indexSpokenNames({ people }) {
  const names = [];
  (people ?? []).forEach((person) => {
    if (person?.sees !== true || type.isNone(person.value) || !type.isString(person.label)) {
      return;
    }
    const words = toSpokenWords(person.label);
    if (words.length === 0) {
      return;
    }
    names.push({ person, words, full: words.join(' ') });
  });
  return names;
}

export { toSpokenWords };
export default indexSpokenNames;
