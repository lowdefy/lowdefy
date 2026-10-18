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

import getSpokenMentionWords from './getSpokenMentionWords.js';

test('getSpokenMentionWords is "for" by default', () => {
  expect(getSpokenMentionWords({})).toEqual(['for']);
  expect(getSpokenMentionWords({ spokenMentions: {} })).toEqual(['for']);
  expect(getSpokenMentionWords({ spokenMentions: true })).toEqual(['for']);
});

test('getSpokenMentionWords takes the configured words, trimmed and lower case', () => {
  expect(getSpokenMentionWords({ spokenMentions: { words: ['For', ' hey ', 'at', ''] } })).toEqual([
    'for',
    'hey',
    'at',
  ]);
  expect(getSpokenMentionWords({ spokenMentions: { words: [] } })).toEqual([]);
});

test('getSpokenMentionWords is null when spoken mentions are off', () => {
  expect(getSpokenMentionWords({ spokenMentions: false })).toBeNull();
});
