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

import getChatSeed from './getChatSeed.js';

test('getChatSeed keeps the parts a new chat starts with', () => {
  expect(
    getChatSeed({
      sharedState: { task: { key: 'ACME-12' } },
      welcome: { title: 'About ACME-12' },
      input: 'What is left on ACME-12?',
      tag: 'ACME-12',
      title: 'ACME-12 questions',
    })
  ).toEqual({
    input: 'What is left on ACME-12?',
    sharedState: { task: { key: 'ACME-12' } },
    tag: 'ACME-12',
    title: 'ACME-12 questions',
    welcome: { title: 'About ACME-12' },
  });
});

test('getChatSeed leaves out empty and mistyped parts', () => {
  expect(getChatSeed({ input: 'Hi', sharedState: {}, tag: 3, title: ' ', welcome: 'x' })).toEqual({
    input: 'Hi',
    sharedState: null,
    tag: null,
    title: null,
    welcome: null,
  });
});

test('getChatSeed returns null for no seed, or one that names nothing', () => {
  expect(getChatSeed()).toBeNull();
  expect(getChatSeed(null)).toBeNull();
  expect(getChatSeed('ACME-12')).toBeNull();
  expect(getChatSeed({})).toBeNull();
  expect(getChatSeed({ input: '', sharedState: {} })).toBeNull();
});
