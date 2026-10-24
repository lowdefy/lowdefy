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

const FIRST_LETTER = /[\p{L}\p{N}]/u;

function firstLetter(word) {
  return word.match(FIRST_LETTER)?.[0] ?? '';
}

// An email address stands for its name part, split where names usually are: ada.lovelace@...
function getWords(name) {
  const text = name.includes('@') ? name.split('@')[0].replace(/[._+-]+/g, ' ') : name;
  return text.split(/\s+/).filter((word) => FIRST_LETTER.test(word));
}

/**
 * The initials an avatar shows for a name: the first letters of its first and last words
 * ("Pieter van Dam" is PD), or the first letter of a one-word name. An email address is read by
 * its name part. `content` wins, so a person's own initials can be set.
 *
 * @param {Object} params
 * @param {string} [params.name]
 * @param {string} [params.content] Initials to show as they are.
 * @returns {string} Upper case initials, or '' when there is no name.
 */
function getInitials({ content, name }) {
  if (type.isString(content)) {
    return content;
  }
  if (!type.isString(name)) {
    return '';
  }
  const words = getWords(name.trim());
  if (words.length === 0) {
    return '';
  }
  const first = firstLetter(words[0]);
  if (words.length === 1) {
    return first.toLocaleUpperCase();
  }
  return `${first}${firstLetter(words[words.length - 1])}`.toLocaleUpperCase();
}

export default getInitials;
