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

import hashJourney from './hashJourney.js';

const journey = {
  name: 'Save an order',
  pageId: 'orders',
  data: 'shop',
  user: 'owner',
  pathParams: { id: '1' },
  urlQuery: { tab: 'items' },
  steps: [{ click: 'save' }],
};

test('hashJourney ignores what does not change the run: name, tags, evidence', () => {
  expect(
    hashJourney({
      ...journey,
      name: 'Renamed',
      tags: ['smoke'],
      evidence: { production: { months: [] } },
    })
  ).toEqual(hashJourney(journey));
});

test('hashJourney changes when any field the run reads changes', () => {
  const base = hashJourney(journey);
  [
    { pageId: 'refunds' },
    { data: 'other' },
    { user: 'clerk' },
    { pathParams: { id: '2' } },
    { urlQuery: {} },
    { steps: [{ click: 'cancel' }] },
  ].forEach((change) => {
    expect(hashJourney({ ...journey, ...change })).not.toEqual(base);
  });
});
