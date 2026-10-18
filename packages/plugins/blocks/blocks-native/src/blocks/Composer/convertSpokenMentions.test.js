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

import convertSpokenMentions from './convertSpokenMentions.js';
import { toDisplay, toValue } from './segmentText.js';

const people = [
  { value: 'u1', label: 'Sam Tolmay', sees: true },
  { value: 'u2', label: 'Puffin Agent', sees: true },
  { value: 'u3', label: 'Gerrie van Wyk', sees: true },
  { value: 'u4', label: 'Hidden Person', sees: false },
];

// The shown text after converting `text`, or the text itself when nothing changed.
function convert(text, options = {}) {
  const result = convertSpokenMentions({
    segments: [{ kind: 'text', text }],
    people: options.people ?? people,
    words: options.words ?? ['for'],
    final: options.final,
  });
  return result === null ? text : toDisplay(result.segments);
}

describe('the examples', () => {
  test('"for Puffin," becomes a mention of Puffin Agent and the comma goes', () => {
    expect(convert('for Puffin, please check the build')).toBe(
      '@Puffin Agent please check the build'
    );
  });

  test('"for Sam" becomes a mention of Sam Tolmay', () => {
    expect(convert('for Sam can you look')).toBe('@Sam Tolmay can you look');
  });

  test('the value holds the mention token', () => {
    const result = convertSpokenMentions({
      segments: [{ kind: 'text', text: 'For Sam, can you look' }],
      people,
      words: ['for'],
    });
    expect(toValue({ segments: result.segments, format: '[[user:{id}]]' })).toBe(
      '[[user:u1]] can you look'
    );
    expect(result.segments[0]).toEqual({
      kind: 'mention',
      id: 'u1',
      name: 'Sam Tolmay',
      sees: true,
    });
  });
});

describe('where a trigger counts', () => {
  test('at the start of the text, after leading spaces', () => {
    expect(convert('  for Sam can you look')).toBe('  @Sam Tolmay can you look');
  });

  test('at the start of a sentence', () => {
    expect(convert('The build failed. For Sam, can you look')).toBe(
      'The build failed. @Sam Tolmay can you look'
    );
    expect(convert('Done! for Sam please merge')).toBe('Done! @Sam Tolmay please merge');
    expect(convert('Ready? For Sam: merge it')).toBe('Ready? @Sam Tolmay: merge it');
    expect(convert('It works… for Sam to merge')).toBe('It works… @Sam Tolmay to merge');
  });

  test('after a sentence that ends in a closing quote or bracket', () => {
    expect(convert('He said "ship it." For Sam, merge')).toBe(
      'He said "ship it." @Sam Tolmay merge'
    );
    expect(convert('(Tested on iOS.) For Sam, merge')).toBe('(Tested on iOS.) @Sam Tolmay merge');
  });

  test('at the start of a line', () => {
    expect(convert('Looks good\nfor Sam please merge')).toBe(
      'Looks good\n@Sam Tolmay please merge'
    );
  });

  test('after a comma', () => {
    expect(convert('Thanks, for Sam can you merge')).toBe('Thanks, @Sam Tolmay can you merge');
  });

  test('not in the middle of a sentence', () => {
    expect(convert('wait for Sam to merge')).toBe('wait for Sam to merge');
    expect(convert('We waited for Puffin, then merged')).toBe('We waited for Puffin, then merged');
    expect(convert('This is for Sam')).toBe('This is for Sam');
  });

  test('not inside a word', () => {
    expect(convert('therefor Sam is right')).toBe('therefor Sam is right');
  });

  test('not after a bracket or quote that opens', () => {
    expect(convert('(for Sam) merge')).toBe('(for Sam) merge');
  });

  test('not after a mention, which does not end a sentence', () => {
    const result = convertSpokenMentions({
      segments: [
        { kind: 'mention', id: 'u2', name: 'Puffin Agent', sees: true },
        { kind: 'text', text: ' for Sam please' },
      ],
      people,
      words: ['for'],
    });
    expect(result).toBeNull();
  });

  test('after a mention and a sentence end', () => {
    const result = convertSpokenMentions({
      segments: [
        { kind: 'mention', id: 'u2', name: 'Puffin Agent', sees: true },
        { kind: 'text', text: ' thanks. For Sam, please merge' },
      ],
      people,
      words: ['for'],
    });
    expect(toDisplay(result.segments)).toBe('@Puffin Agent thanks. @Sam Tolmay please merge');
  });

  test('the trigger word ignores case', () => {
    expect(convert('FOR sam, merge')).toBe('@Sam Tolmay merge');
  });
});

describe('the name', () => {
  test('a full name takes all its words', () => {
    expect(convert('for Sam Tolmay can you look')).toBe('@Sam Tolmay can you look');
    expect(convert('for Gerrie van Wyk, please review')).toBe('@Gerrie van Wyk please review');
  });

  test('a first name or a unique prefix of one, ignoring case', () => {
    expect(convert('for gerrie, please review')).toBe('@Gerrie van Wyk please review');
    expect(convert('for Ger, please review')).toBe('@Gerrie van Wyk please review');
    expect(convert('for puff please check')).toBe('@Puffin Agent please check');
  });

  test('a prefix shorter than three letters names no one', () => {
    expect(convert('for Sa please check')).toBe('for Sa please check');
  });

  test('a common word does not stand for a name it starts', () => {
    const theo = [{ value: 't', label: 'Theodore Ndlovu', sees: true }];
    expect(convert('For the record, it works', { people: theo })).toBe('For the record, it works');
    expect(convert('For Theo, it works', { people: theo })).toBe('@Theodore Ndlovu it works');
  });

  test('a word that is no one’s name is left as it is', () => {
    expect(convert('For example, this works')).toBe('For example, this works');
    expect(convert('For now, ship it')).toBe('For now, ship it');
  });

  test('only people who see the record are matched', () => {
    expect(convert('for Hidden, please look')).toBe('for Hidden, please look');
  });

  test('a first name two people share is left for the person to pick with @', () => {
    const twoSams = [...people, { value: 'u5', label: 'Sam Smith', sees: true }];
    expect(convert('for Sam can you look', { people: twoSams })).toBe('for Sam can you look');
    expect(convert('for Sam Smith can you look', { people: twoSams })).toBe(
      '@Sam Smith can you look'
    );
  });

  test('a prefix two names share names no one', () => {
    const two = [
      { value: 'a', label: 'Samantha Jones', sees: true },
      { value: 'b', label: 'Samuel Moyo', sees: true },
    ];
    expect(convert('for Sam please look', { people: two })).toBe('for Sam please look');
    expect(convert('for Samu please look', { people: two })).toBe('@Samuel Moyo please look');
  });

  test('a first name wins over a longer name it starts', () => {
    const both = [
      { value: 'a', label: 'Sam Tolmay', sees: true },
      { value: 'b', label: 'Samantha Jones', sees: true },
    ];
    expect(convert('for Sam please look', { people: both })).toBe('@Sam Tolmay please look');
  });

  test('a possessive is not a name', () => {
    expect(convert("For Sam's PR, merge it")).toBe("For Sam's PR, merge it");
  });

  test('names with curly apostrophes and hyphens match', () => {
    const named = [
      { value: 'a', label: 'Seán O’Brien', sees: true },
      { value: 'b', label: 'Jean-Luc Picard', sees: true },
    ];
    expect(convert("for Seán O'Brien, look", { people: named })).toBe('@Seán O’Brien look');
    expect(convert('for jean-luc, engage', { people: named })).toBe('@Jean-Luc Picard engage');
  });
});

describe('a name still being typed or spoken', () => {
  test('at the very end of the text is left until a word or mark follows it', () => {
    expect(convert('for Sam')).toBe('for Sam');
    expect(convert('for Sam ')).toBe('@Sam Tolmay ');
    expect(convert('for Sam,')).toBe('@Sam Tolmay');
  });

  test('at the end of the text is converted when the text is final', () => {
    expect(convert('Hey. For Sam', { final: true })).toBe('Hey. @Sam Tolmay');
  });

  test('followed by more letters is not the name', () => {
    expect(convert('for Samwise please')).toBe('for Samwise please');
  });
});

describe('the comma', () => {
  test('a comma after the name goes, keeping one space', () => {
    expect(convert('for Sam, merge')).toBe('@Sam Tolmay merge');
  });

  test('a comma with no space after it leaves a space after the mention', () => {
    expect(convert('for Sam,merge')).toBe('@Sam Tolmay merge');
  });

  test('other marks after the name stay', () => {
    expect(convert('for Sam. Merge')).toBe('@Sam Tolmay. Merge');
  });
});

describe('the trigger words', () => {
  test('are configurable', () => {
    expect(convert('Hey Sam, can you look', { words: ['for', 'hey', 'at'] })).toBe(
      '@Sam Tolmay can you look'
    );
    expect(convert('at Puffin please check', { words: ['for', 'hey', 'at'] })).toBe(
      '@Puffin Agent please check'
    );
    expect(convert('Hey Sam, can you look')).toBe('Hey Sam, can you look');
  });

  test('a typed @ and a name becomes a mention anywhere in a sentence', () => {
    expect(convert('please ask @Sam to look')).toBe('please ask @Sam Tolmay to look');
    expect(convert('@puffin, check the build', { words: [] })).toBe(
      '@Puffin Agent check the build'
    );
  });

  test('an @ inside a word, as in an email address, is left', () => {
    expect(convert('mail sam@sam.io now')).toBe('mail sam@sam.io now');
  });

  test('an @ name still being typed is left', () => {
    expect(convert('ask @Sam')).toBe('ask @Sam');
  });
});

describe('several mentions and existing mentions', () => {
  test('converts each address in the text', () => {
    expect(convert('For Sam, merge it. For Puffin, run the tests')).toBe(
      '@Sam Tolmay merge it. @Puffin Agent run the tests'
    );
  });

  test('never changes a mention already in the text', () => {
    const segments = [
      { kind: 'text', text: 'for ' },
      { kind: 'mention', id: 'u2', name: 'Puffin Agent', sees: true },
      { kind: 'text', text: ' and for Sam ok' },
    ];
    expect(convertSpokenMentions({ segments, people, words: ['for'] })).toBeNull();
  });

  test('reports each replaced range of the shown text', () => {
    const result = convertSpokenMentions({
      segments: [
        { kind: 'mention', id: 'u2', name: 'Puffin Agent', sees: true },
        { kind: 'text', text: '. For Sam, merge' },
      ],
      people,
      words: ['for'],
    });
    // "@Puffin Agent" is 13 long; "For Sam," runs from 15 to 23 and "@Sam Tolmay" is 11 long.
    expect(result.edits).toEqual([{ start: 15, end: 23, length: 11 }]);
    expect(toDisplay(result.segments)).toBe('@Puffin Agent. @Sam Tolmay merge');
  });

  test('returns null when nothing changes or no one can be mentioned', () => {
    expect(
      convertSpokenMentions({ segments: [{ kind: 'text', text: 'hi' }], people, words: ['for'] })
    ).toBeNull();
    expect(
      convertSpokenMentions({
        segments: [{ kind: 'text', text: 'for Sam ok' }],
        people: [],
        words: ['for'],
      })
    ).toBeNull();
  });
});
