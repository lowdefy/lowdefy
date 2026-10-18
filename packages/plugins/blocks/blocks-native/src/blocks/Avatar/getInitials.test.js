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

import getInitials from './getInitials.js';

test('getInitials takes the first letters of the first and last words', () => {
  expect(getInitials({ name: 'Gerrie van Wyk' })).toEqual('GW');
  expect(getInitials({ name: 'ada lovelace' })).toEqual('AL');
  expect(getInitials({ name: '  Sam   Tolmay ' })).toEqual('ST');
});

test('getInitials takes one letter of a one-word name', () => {
  expect(getInitials({ name: 'Pelican' })).toEqual('P');
});

test('getInitials reads an email address by its name part', () => {
  expect(getInitials({ name: 'ada.lovelace@example.com' })).toEqual('AL');
  expect(getInitials({ name: 'gvw@example.com' })).toEqual('G');
});

test('getInitials skips punctuation and keeps letters outside ASCII', () => {
  expect(getInitials({ name: '(Émile) Zola' })).toEqual('ÉZ');
  expect(getInitials({ name: 'Ада Лавлейс' })).toEqual('АЛ');
});

test('getInitials returns content as it is, and nothing for no name', () => {
  expect(getInitials({ name: 'Ada Lovelace', content: 'Ad' })).toEqual('Ad');
  expect(getInitials({})).toEqual('');
  expect(getInitials({ name: ' - ' })).toEqual('');
});
