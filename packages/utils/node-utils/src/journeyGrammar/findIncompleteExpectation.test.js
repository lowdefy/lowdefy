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

import findIncompleteExpectation from './findIncompleteExpectation.js';

test('findIncompleteExpectation returns undefined when every state expectation has equals', () => {
  expect(
    findIncompleteExpectation({
      steps: [{ click: 'submit' }, { expect: { state: { path: 'title', equals: 'done' } } }],
    })
  ).toBeUndefined();
});

test('findIncompleteExpectation names the first state expectation without equals', () => {
  expect(
    findIncompleteExpectation({
      steps: [
        { click: 'submit' },
        { expect: { state: { path: 'title' } } },
        { expect: { state: { path: 'other' } } },
      ],
    })
  ).toEqual({
    index: 1,
    path: 'title',
    message:
      'Incomplete expectation at step 1: "expect.state" for path "title" has no "equals". Run lowdefy test --update to fill it from the observed state.',
  });
});

test('findIncompleteExpectation treats a null equals as filled', () => {
  expect(
    findIncompleteExpectation({ steps: [{ expect: { state: { path: 'title', equals: null } } }] })
  ).toBeUndefined();
});

test('findIncompleteExpectation returns undefined when steps is not an array', () => {
  expect(findIncompleteExpectation({ steps: undefined })).toBeUndefined();
});
