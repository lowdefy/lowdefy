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

import findPlaceholderStep from './findPlaceholderStep.js';

test('findPlaceholderStep names the first fill placeholder with its step index', () => {
  expect(
    findPlaceholderStep({
      steps: [
        { click: 'new' },
        { fill: { blockId: 'title', value: 'Ada', from: 'recorded' } },
        { fill: { blockId: 'password', value: null, from: 'shape' } },
      ],
    })
  ).toEqual({
    error:
      'Step 2: fill on "password" has a placeholder value (from: shape). Fill it from the data set or the journey\'s user, then remove from.',
  });
});

test('findPlaceholderStep names a select placeholder and an expect.state placeholder', () => {
  expect(
    findPlaceholderStep({ steps: [{ select: { blockId: 'owner', value: null, from: 'shape' } }] })
      .error
  ).toContain('Step 0: select on "owner" has a placeholder value');
  expect(
    findPlaceholderStep({
      steps: [{ expect: { state: { path: 'owner', equals: null, from: 'shape' } } }],
    }).error
  ).toContain('Step 0: expect.state on "owner" has a placeholder value');
});

test('findPlaceholderStep returns no error for recorded values and plain steps', () => {
  expect(
    findPlaceholderStep({
      steps: [
        { click: 'new' },
        { fill: { blockId: 'title', value: 'Ada', from: 'recorded' } },
        { expect: { state: { path: 'title', equals: 'Ada', from: 'recorded' } } },
        { press: 'Enter' },
      ],
    })
  ).toEqual({});
});
