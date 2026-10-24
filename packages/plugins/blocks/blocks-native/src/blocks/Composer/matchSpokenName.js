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

// Words that follow "for", "hey" or "at" at the start of a sentence often enough that a prefix
// of a name must not stand for them: "For the record", "Hey all", "At least". A person's full
// first name still matches.
const COMMON_WORDS = new Set(
  [
    'again all any anyone both breakfast context days dinner each either ever every everybody',
    'everyone example first folks free good guys her here him his home how info instance its',
    'last later least less long lunch months more most neither next now once one our real',
    'reference some someone starters sure team that the their them then there these this those',
    'three today tomorrow tonight two weeks what when where which while who why work years you',
    'your',
  ]
    .join(' ')
    .split(' ')
);

const MIN_PREFIX = 3;

// The one full name the longest run of the spoken words is. Two people with that name are a tie
// no more words can break.
function matchFullName({ names, spoken }) {
  for (let count = spoken.length; count > 0; count -= 1) {
    const phrase = spoken.slice(0, count).join(' ');
    const found = names.filter((name) => name.full === phrase);
    if (found.length === 1) {
      return { person: found[0].person, count };
    }
    if (found.length > 1) {
      return { person: null, count };
    }
  }
  return null;
}

/**
 * The person the words after "for" (or @) name: a person's full name, else their first name,
 * else a prefix of their name of three or more letters that no common word takes. Case is
 * ignored. A name two people share matches no one, so the person picks with @.
 *
 * @param {Object} params
 * @param {Array<{ person: Object, words: string[], full: string }>} params.names From
 *   indexSpokenNames.
 * @param {string[]} params.spoken The words after the trigger, as toSpokenWords gives them; as
 *   many as the longest name has.
 * @returns {{ person: Object, count: number } | null} The person and how many of the words
 *   name them.
 */
function matchSpokenName({ names, spoken }) {
  if (spoken.length === 0) {
    return null;
  }
  const full = matchFullName({ names, spoken });
  if (full !== null) {
    return full.person === null ? null : full;
  }
  const word = spoken[0];
  const first = names.filter((name) => name.words[0] === word);
  if (first.length > 0) {
    return first.length === 1 ? { person: first[0].person, count: 1 } : null;
  }
  if (word.length < MIN_PREFIX || COMMON_WORDS.has(word)) {
    return null;
  }
  const prefixed = names.filter((name) => name.words[0].startsWith(word));
  return prefixed.length === 1 ? { person: prefixed[0].person, count: 1 } : null;
}

export default matchSpokenName;
