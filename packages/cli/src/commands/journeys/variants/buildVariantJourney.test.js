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

import checkJourneyItem from '../../test/checkJourneyItem.js';
import expandJourney from '../../test/expandJourney.js';
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

test('buildVariantJourney keeps the stubs of the journey it varies', () => {
  const stubs = [
    {
      connectionType: 'AxiosHttp',
      requestType: 'AxiosHttp',
      answer: { data: { rate: 1.2 } },
    },
    { requestId: 'save', fail: 'Down', times: 1 },
  ];
  const journey = { name: 'saves', pageId: 'orders', data: 'orders', stubs, steps: [] };
  const built = buildVariantJourney({
    journey,
    variant: { ...variant, overrides: { data: 'orders-empty' } },
  });
  expect(built).toEqual({
    name: 'saves — double-submit: double click "save"',
    pageId: 'orders',
    data: 'orders-empty',
    variant: { of: 'saves', kind: 'double-submit', detail: 'double click "save"' },
    stubs,
    steps: variant.steps,
  });
});

test('buildVariantJourney leaves stubs and cases out when the journey has none', () => {
  const built = buildVariantJourney({
    journey: { name: 'saves', pageId: 'orders', steps: [] },
    variant,
  });
  expect(built).not.toHaveProperty('stubs');
  expect(built).not.toHaveProperty('cases');
});

test('a variant of a case-table journey keeps the table and runs once per row', () => {
  const cases = [
    { name: 'admin', user: 'admin', order: 'o1' },
    { name: 'clerk', user: 'clerk', order: 'o2' },
  ];
  const journey = {
    name: 'saves',
    pageId: 'orders',
    data: 'orders',
    user: { _case: 'user' },
    cases,
    steps: [{ fill: { blockId: 'order', value: { _case: 'order' } } }, { click: 'save' }],
  };
  const built = buildVariantJourney({
    journey,
    variant: { ...variant, steps: [...journey.steps, { click: 'save' }] },
  });
  expect(built.cases).toEqual(cases);
  expect(built.user).toEqual({ _case: 'user' });
  const runs = expandJourney({ item: { filePath: 'v.yaml', journeyIndex: 0, journey: built } });
  expect(runs.map((run) => run.journey.name)).toEqual([
    'saves — double-submit: double click "save" [admin]',
    'saves — double-submit: double click "save" [clerk]',
  ]);
  expect(runs.map((run) => run.journey.user)).toEqual(['admin', 'clerk']);
  expect(runs[1].journey.steps[0]).toEqual({ fill: { blockId: 'order', value: 'o2' } });
  runs.forEach((run) => expect(checkJourneyItem({ item: run })).toBeUndefined());
});

test('a role variant of a case-table journey runs each row as the user it overrides with', () => {
  const journey = {
    name: 'saves',
    pageId: 'orders',
    data: 'orders',
    user: { _case: 'user' },
    cases: [
      { name: 'admin', user: 'admin', order: 'o1' },
      { name: 'clerk', user: 'clerk', order: 'o2' },
    ],
    steps: [{ fill: { blockId: 'order', value: { _case: 'order' } } }, { click: 'save' }],
  };
  const built = buildVariantJourney({
    journey,
    variant: {
      kind: 'role',
      detail: 'granted to viewer [viewer]',
      overrides: { user: 'viewer' },
      steps: journey.steps,
    },
  });
  const runs = expandJourney({ item: { filePath: 'v.yaml', journeyIndex: 0, journey: built } });
  expect(runs.map((run) => run.journey.user)).toEqual(['viewer', 'viewer']);
  expect(runs.map((run) => run.journey.steps[0].fill.value)).toEqual(['o1', 'o2']);
  runs.forEach((run) => expect(checkJourneyItem({ item: run })).toBeUndefined());
});
