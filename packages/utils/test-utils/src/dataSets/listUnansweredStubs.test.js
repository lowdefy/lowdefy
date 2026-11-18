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

import { expect, test } from 'vitest';

import listUnansweredStubs from './listUnansweredStubs.js';

function stub(fields) {
  return { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: null, ...fields };
}

test('listUnansweredStubs lists a stub that names its target and never answered', () => {
  const named = [
    stub({ requestId: 'rate', answered: 0 }),
    stub({ endpoint: 'price_run', answered: 0 }),
    stub({ pageId: 'checkout', answered: 0 }),
    stub({ match: { params: { currency: 'USD' } }, answered: 0 }),
  ];
  expect(listUnansweredStubs({ session: { stubs: named } })).toEqual(named);
});

test('listUnansweredStubs leaves out a fallback stub, keyed only by its types, that never answered', () => {
  const fallback = stub({ answered: 0 });
  expect(listUnansweredStubs({ session: { stubs: [fallback] } })).toEqual([]);
});

test('listUnansweredStubs leaves out a stub that answered', () => {
  expect(
    listUnansweredStubs({ session: { stubs: [stub({ requestId: 'rate', answered: 2 })] } })
  ).toEqual([]);
});

test('listUnansweredStubs leaves out a test session.stub, which counts no answers', () => {
  expect(listUnansweredStubs({ session: { stubs: [stub({ requestId: 'rate' })] } })).toEqual([]);
});
