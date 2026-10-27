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
 * The people the mention picker offers for a query: those with `sees` true whose name holds the
 * query, ignoring case. Names that start with it come first, then names with a word that starts
 * with it, then the rest, each in the order given; at most `limit`.
 *
 * @param {Object} params
 * @param {Array<{ value: string, label: string, sees?: boolean }>} params.people
 * @param {string} params.query
 * @param {number} [params.limit] 8 when not set.
 * @returns {Array} The people to offer.
 */
function rankMentions({ people, query, limit = 8 }) {
  const needle = String(query ?? '').toLocaleLowerCase();
  const ranked = [];
  (people ?? []).forEach((person) => {
    if (person?.sees !== true || type.isNone(person.value) || !type.isString(person.label)) {
      return;
    }
    const name = person.label.toLocaleLowerCase();
    const at = name.indexOf(needle);
    if (at < 0) {
      return;
    }
    let rank = 2;
    if (at === 0) {
      rank = 0;
    } else if (/\s/.test(name[at - 1])) {
      rank = 1;
    }
    ranked.push({ person, rank });
  });
  return ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((entry) => entry.person);
}

export default rankMentions;
