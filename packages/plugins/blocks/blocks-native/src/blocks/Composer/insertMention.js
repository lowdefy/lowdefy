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

import replaceRange from './replaceRange.js';

/**
 * Replaces the @ and its query, [at, cursor) of the shown text, with a mention of `person`.
 *
 * @param {Object} params
 * @param {Array} params.segments
 * @param {number} params.at The offset of the @.
 * @param {number} params.cursor
 * @param {{ value: string, label: string, sees?: boolean }} params.person
 * @returns {{ segments: Array, cursor: number }}
 */
function insertMention({ segments, at, cursor, person }) {
  const segment = {
    kind: 'mention',
    id: String(person.value),
    name: person.label,
    sees: person.sees !== false,
  };
  return replaceRange({ segments, from: at, to: cursor, units: [{ segment }] });
}

export default insertMention;
