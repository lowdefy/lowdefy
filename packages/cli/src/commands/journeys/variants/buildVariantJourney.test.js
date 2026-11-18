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

import buildVariantJourney from './buildVariantJourney.js';

const variant = {
  kind: 'double-submit',
  detail: 'double click "save"',
  steps: [{ click: 'save' }, { click: 'save' }],
};

test('buildVariantJourney keeps serial from the journey it varies', () => {
  const journey = { name: 'saves', pageId: 'orders', data: 'orders', serial: true, steps: [] };
  expect(buildVariantJourney({ journey, variant })).toEqual({
    name: 'saves — double-submit: double click "save"',
    pageId: 'orders',
    data: 'orders',
    serial: true,
    variant: { of: 'saves', kind: 'double-submit', detail: 'double click "save"' },
    steps: variant.steps,
  });
});

test('buildVariantJourney leaves serial out when the journey has none', () => {
  const journey = { name: 'saves', pageId: 'orders', steps: [] };
  expect(buildVariantJourney({ journey, variant })).not.toHaveProperty('serial');
});
