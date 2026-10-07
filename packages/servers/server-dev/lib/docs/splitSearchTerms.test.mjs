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

import splitSearchTerms from './splitSearchTerms.js';

test('splitSearchTerms lowercases and splits on spaces and punctuation', () => {
  expect(splitSearchTerms({ query: 'Link action, pathParams? (path parameters)' })).toEqual([
    'link',
    'action',
    'pathparams',
    'path',
    'parameters',
  ]);
});

test('splitSearchTerms drops one- and two-letter terms and common words', () => {
  expect(splitSearchTerms({ query: 'How to use a Modal with the blocks' })).toEqual([
    'modal',
    'blocks',
  ]);
});

test('splitSearchTerms counts a repeated term once', () => {
  expect(splitSearchTerms({ query: 'state State STATE page' })).toEqual(['state', 'page']);
});

test('splitSearchTerms keeps operator names whole', () => {
  expect(splitSearchTerms({ query: '_string.concat $match _if.' })).toEqual([
    '_string.concat',
    '$match',
    '_if',
  ]);
});

test('splitSearchTerms returns no terms when every word is dropped', () => {
  expect(splitSearchTerms({ query: 'to a of' })).toEqual([]);
});
