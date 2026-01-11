/*
  Copyright 2020-2024 Lowdefy, Inc

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

import findSimilarString from './findSimilarString.js';

test('findSimilarString returns null for empty input', () => {
  expect(findSimilarString({ input: '', candidates: ['Button'] })).toBe(null);
  expect(findSimilarString({ input: null, candidates: ['Button'] })).toBe(null);
  expect(findSimilarString({ input: undefined, candidates: ['Button'] })).toBe(null);
});

test('findSimilarString returns null for empty candidates', () => {
  expect(findSimilarString({ input: 'Buton', candidates: [] })).toBe(null);
  expect(findSimilarString({ input: 'Buton', candidates: null })).toBe(null);
});

test('findSimilarString finds single character typo', () => {
  const candidates = ['Button', 'TextInput', 'Card', 'Container'];
  expect(findSimilarString({ input: 'Buton', candidates })).toBe('Button');
  expect(findSimilarString({ input: 'TextInpt', candidates })).toBe('TextInput');
});

test('findSimilarString finds case-insensitive matches', () => {
  const candidates = ['Button', 'TextInput'];
  expect(findSimilarString({ input: 'button', candidates })).toBe('Button');
  expect(findSimilarString({ input: 'BUTTON', candidates })).toBe('Button');
});

test('findSimilarString returns null for too different strings', () => {
  const candidates = ['Button', 'TextInput'];
  expect(findSimilarString({ input: 'CompletelyDifferent', candidates })).toBe(null);
});

test('findSimilarString finds transposed characters', () => {
  const candidates = ['AxiosHttp', 'MongoDBFind'];
  expect(findSimilarString({ input: 'AxiosHtpt', candidates })).toBe('AxiosHttp');
  expect(findSimilarString({ input: 'MongoDBFnid', candidates })).toBe('MongoDBFind');
});

test('findSimilarString finds missing character', () => {
  const candidates = ['Container', 'Button'];
  expect(findSimilarString({ input: 'Contaner', candidates })).toBe('Container');
});

test('findSimilarString respects maxDistance', () => {
  const candidates = ['Button'];
  expect(findSimilarString({ input: 'Butn', candidates, maxDistance: 2 })).toBe('Button');
  expect(findSimilarString({ input: 'Bt', candidates, maxDistance: 2 })).toBe(null);
});

test('findSimilarString for operator typos', () => {
  const candidates = ['_state', '_get', '_if', '_and', '_or', '_sum'];
  expect(findSimilarString({ input: '_staet', candidates })).toBe('_state');
  expect(findSimilarString({ input: '_gett', candidates })).toBe('_get');
  expect(findSimilarString({ input: '_sume', candidates })).toBe('_sum');
});
