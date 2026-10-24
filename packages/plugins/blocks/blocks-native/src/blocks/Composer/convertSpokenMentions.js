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

import { displayOf } from './segmentText.js';
import indexSpokenNames, { toSpokenWords } from './indexSpokenNames.js';
import matchSpokenName from './matchSpokenName.js';

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/uy;
const GAP = /[ \t]+/y;
const WORD_CHAR = /[\p{L}\p{N}_@]/u;
const SENTENCE_END = /[.!?…,]/;
const CLOSING = /["'”’)\]]/;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// "for Sam" addresses Sam only where a sentence starts: at the start of the text or a line,
// after a sentence's end (a closing quote or bracket may follow it) or after a comma. Mid
// sentence, "wait for Sam" is about Sam.
function startsSentence({ text, at, startsText }) {
  let index = at - 1;
  let newline = false;
  while (index >= 0 && /\s/.test(text[index])) {
    newline = newline || text[index] === '\n';
    index -= 1;
  }
  if (index < 0) {
    return startsText;
  }
  if (newline) {
    return true;
  }
  if (index === at - 1) {
    return false;
  }
  while (index >= 0 && CLOSING.test(text[index])) {
    index -= 1;
  }
  return index >= 0 && SENTENCE_END.test(text[index]);
}

// The words after a trigger, each with where it ends, as many as the longest name has.
function readWords({ text, from, max }) {
  const words = [];
  let index = from;
  while (words.length < max) {
    WORD.lastIndex = index;
    const word = WORD.exec(text);
    if (word === null) {
      break;
    }
    words.push({ word: word[0], end: WORD.lastIndex });
    GAP.lastIndex = WORD.lastIndex;
    if (GAP.exec(text) === null) {
      break;
    }
    index = GAP.lastIndex;
  }
  return words;
}

// The mention that replaces a trigger and a name in a text, or null. A name at the very end of
// the text is still being typed or spoken unless `final`.
function findAt({ endsText, match, max, names, startsText, text, final }) {
  const at = match.index;
  if (at > 0 && WORD_CHAR.test(text[at - 1])) {
    return null;
  }
  if (match[0] !== '@' && !startsSentence({ text, at, startsText })) {
    return null;
  }
  const words = readWords({ text, from: at + match[0].length, max });
  const found = matchSpokenName({
    names,
    spoken: words.map(({ word }) => toSpokenWords(word)[0]),
  });
  if (found === null) {
    return null;
  }
  const nameEnd = words[found.count - 1].end;
  if (nameEnd === text.length && endsText && !final) {
    return null;
  }
  if (nameEnd < text.length && WORD_CHAR.test(text[nameEnd])) {
    return null;
  }
  let end = nameEnd;
  let space = '';
  if (text[end] === ',') {
    end += 1;
    space = end < text.length && !/\s/.test(text[end]) ? ' ' : '';
  }
  return { start: at, end, person: found.person, space };
}

/**
 * Turns spoken addressing into mentions, for dictated comments: "for Falcon, please check" is
 * "@Falcon Agent please check". A trigger word (`for` by default) at the start of a sentence, or
 * a typed "@", followed by a person's full name, first name or a prefix of it (matchSpokenName)
 * becomes a mention of them; the trigger and a comma after the name go. Mentions already in the
 * text are left as they are.
 *
 * @param {Object} params
 * @param {Array} params.segments The composer's segments (parseMentionValue).
 * @param {Array<{ value: string, label: string, sees?: boolean }>} params.people Only people who
 *   see the record are matched.
 * @param {string[]} params.words The trigger words, lower case.
 * @param {boolean} [params.final] The text is complete (it is being sent), so a name at its end
 *   is whole.
 * @returns {{ segments: Array, edits: Array<{ start: number, end: number, length: number }> } | null}
 *   The new segments and each replaced range of the shown text with the length put in its
 *   place, or null when nothing changed.
 */
function convertSpokenMentions({ segments, people, words, final = false }) {
  const names = indexSpokenNames({ people });
  if (names.length === 0) {
    return null;
  }
  const max = Math.max(...names.map((name) => name.words.length));
  const triggers = [...words.map((word) => `${escapeRegExp(word)}[ \\t]+`), '@'];
  const pattern = new RegExp(`(?:${triggers.join('|')})(?=[\\p{L}\\p{N}])`, 'giu');
  const next = [];
  const edits = [];
  let offset = 0;
  segments.forEach((segment, index) => {
    if (segment.kind !== 'text') {
      next.push(segment);
      offset += displayOf(segment).length;
      return;
    }
    const { text } = segment;
    let kept = 0;
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (match.index < kept) {
        continue;
      }
      const found = findAt({
        endsText: index === segments.length - 1,
        final,
        match,
        max,
        names,
        startsText: index === 0,
        text,
      });
      if (found === null) {
        continue;
      }
      if (found.start > kept) {
        next.push({ kind: 'text', text: text.slice(kept, found.start) });
      }
      const mention = {
        kind: 'mention',
        id: String(found.person.value),
        name: found.person.label,
        sees: true,
      };
      next.push(mention);
      if (found.space !== '') {
        next.push({ kind: 'text', text: found.space });
      }
      edits.push({
        start: offset + found.start,
        end: offset + found.end,
        length: displayOf(mention).length + found.space.length,
      });
      kept = found.end;
    }
    if (kept < text.length) {
      next.push({ kind: 'text', text: text.slice(kept) });
    }
    offset += text.length;
  });
  if (edits.length === 0) {
    return null;
  }
  return { segments: joinText(next), edits };
}

// Adjacent text segments as one, as parseMentionValue gives them.
function joinText(segments) {
  const joined = [];
  segments.forEach((segment) => {
    const last = joined[joined.length - 1];
    if (segment.kind === 'text' && last?.kind === 'text') {
      joined[joined.length - 1] = { kind: 'text', text: last.text + segment.text };
      return;
    }
    joined.push(segment);
  });
  return joined;
}

export default convertSpokenMentions;
