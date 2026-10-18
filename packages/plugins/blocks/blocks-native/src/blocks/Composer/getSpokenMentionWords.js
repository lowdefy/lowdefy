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

const DEFAULT_WORDS = ['for'];

/**
 * The trigger words of the Composer's spoken mentions, lower case: `spokenMentions.words`,
 * `for` when not set, or null when `spokenMentions` is false.
 *
 * @param {Object} params
 * @param {false | { words?: string[] }} [params.spokenMentions]
 * @returns {string[] | null}
 */
function getSpokenMentionWords({ spokenMentions }) {
  if (spokenMentions === false) {
    return null;
  }
  if (!type.isObject(spokenMentions) || !type.isArray(spokenMentions.words)) {
    return DEFAULT_WORDS;
  }
  return spokenMentions.words
    .filter((word) => type.isString(word) && word.trim() !== '')
    .map((word) => word.trim().toLocaleLowerCase());
}

export default getSpokenMentionWords;
