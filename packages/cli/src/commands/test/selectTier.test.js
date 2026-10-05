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

import path from 'path';

import expandPersonas from './expandPersonas.js';
import flowLines from '../journeys/evidence/flowLines.js';
import selectTier from './selectTier.js';
import sequenceId from '../journeys/evidence/sequenceId.js';

const configDirectory = path.join('/app');
const context = { directories: { config: configDirectory } };

function filePath(name) {
  return path.join(configDirectory, 'tests', 'journeys', name);
}

// A refreshed journey whose single September month holds `sessions` over 30
// days, unless `months` is given; no evidence when neither is.
function journey({ name, blockId, sessions, months, ...rest }) {
  const steps = [{ click: blockId ?? name.replace(/\W/g, '_') }];
  const result = { name, pageId: 'tickets', ...rest, steps };
  const monthList =
    months ??
    (sessions === undefined
      ? undefined
      : [{ month: '2026-09', days: 30, sessions, persons: 1, orgs: 1, failures: 2 }]);
  if (monthList !== undefined) {
    result.evidence = {
      production: {
        sequence: sequenceId({ pageId: 'tickets', steps }),
        pageId: 'tickets',
        flow: flowLines({ pageId: 'tickets', steps }),
        months: monthList,
      },
    };
  }
  return result;
}

function entries(...items) {
  return items
    .flatMap((item) => expandPersonas({ item }))
    .map((item) => ({ suite: 'journeys', item }));
}

function item({ file, journeyIndex = 0, ...spec }) {
  return { filePath: filePath(file), journeyIndex, journey: journey(spec) };
}

function names(result) {
  return result.selected.map((entry) => entry.item.journey.name);
}

test('selectTier common keeps the common and unranked journeys and skips deprecated ones', async () => {
  const selected = entries(
    item({ file: 'a.yaml', name: 'top', sessions: 300 }),
    item({ file: 'b.yaml', name: 'middle', sessions: 60 }),
    item({ file: 'c.yaml', name: 'low', sessions: 30 }),
    item({ file: 'd.yaml', name: 'new' }),
    item({ file: 'e.yaml', name: 'retired', sessions: 90, deprecated: true })
  );
  const result = await selectTier({ context, selected, tier: 'common', usageWindow: '3m' });
  expect(result.refused).toBeUndefined();
  expect(names(result)).toEqual(['top', 'new']);
  expect(result.selected[0].usage).toEqual({
    tier: 'common',
    rank: 1,
    rate: 10,
    failures: 2,
    unranked: false,
    usageWindow: '3m',
  });
  // A journey with no production evidence has nothing to rank it by.
  expect(result.selected[1].usage).toBeUndefined();
  expect(result.skipped).toEqual([
    { name: 'retired', filePath: filePath('e.yaml'), rate: 3, usageWindow: '3m' },
  ]);
  expect(result.tierRows.map((row) => row.name)).toEqual([
    'top',
    'middle',
    'low',
    'new',
    'retired',
  ]);
});

test('selectTier full keeps every journey but the deprecated ones, with each ranking', async () => {
  const selected = entries(
    item({ file: 'a.yaml', name: 'top', sessions: 30 }),
    item({ file: 'b.yaml', name: 'low', sessions: 3 }),
    item({ file: 'c.yaml', name: 'retired', sessions: 3, deprecated: true })
  );
  const result = await selectTier({ context, selected, tier: 'full', usageWindow: '3m' });
  // Too few matches to cut a tier, but a full run needs no cut.
  expect(result.refused).toBeUndefined();
  expect(names(result)).toEqual(['top', 'low']);
  expect(result.selected.map((entry) => [entry.usage.tier, entry.usage.rank])).toEqual([
    ['common', 1],
    ['edge', 2],
  ]);
  expect(result.skipped.map((skipped) => skipped.name)).toEqual(['retired']);
});

test('selectTier tiers a journey with a list of users once and keeps every persona run', async () => {
  const selected = entries(
    item({
      file: 'a.yaml',
      name: 'edits a ticket',
      sessions: 300,
      data: 'tickets',
      user: ['admin', 'member'],
    }),
    item({ file: 'b.yaml', name: 'low', sessions: 30 })
  );
  const result = await selectTier({ context, selected, tier: 'common', usageWindow: '3m' });
  expect(names(result)).toEqual(['edits a ticket [admin]', 'edits a ticket [member]']);
  expect(result.selected.map((entry) => entry.usage.rank)).toEqual([1, 1]);
  expect(result.tierRows.map((row) => row.name)).toEqual(['edits a ticket', 'low']);
});

test('selectTier tells two journeys of one file apart by their place in it', async () => {
  const selected = entries(
    item({ file: 'a.yaml', journeyIndex: 0, name: 'same name', sessions: 300 }),
    item({ file: 'a.yaml', journeyIndex: 1, name: 'same name', blockId: 'other', sessions: 30 })
  );
  const result = await selectTier({ context, selected, tier: 'common', usageWindow: '3m' });
  expect(result.selected.map((entry) => entry.item.journeyIndex)).toEqual([0]);
});

test('selectTier refuses a tier below 100 matches, and names the refresh with no evidence', async () => {
  const thin = await selectTier({
    context,
    selected: entries(item({ file: 'a.yaml', name: 'top', sessions: 30 })),
    tier: 'common',
    usageWindow: '3m',
  });
  expect(thin.selected).toEqual([]);
  expect(thin.refused).toBe(
    'The selection has 30 journey matches in 2026-07 to 2026-09, fewer than the 100 tiers need. Use --tier full, or pull more production use.'
  );
  const none = await selectTier({
    context,
    selected: entries(item({ file: 'a.yaml', name: 'top' })),
    tier: 'edge',
    usageWindow: '3m',
  });
  expect(none.refused).toContain('lowdefy journeys evidence --refresh');
});

test('selectTier cuts over the usage window it is given', async () => {
  const selected = entries(
    item({
      file: 'a.yaml',
      name: 'older',
      months: [
        { month: '2026-04', days: 30, sessions: 300, persons: 1, orgs: 1, failures: 0 },
        { month: '2026-09', days: 30, sessions: 30, persons: 1, orgs: 1, failures: 0 },
      ],
    }),
    item({ file: 'b.yaml', name: 'steady', sessions: 90 })
  );
  const threeMonths = await selectTier({ context, selected, tier: 'common', usageWindow: '3m' });
  expect(names(threeMonths)).toEqual(['steady']);
  const sixMonths = await selectTier({ context, selected, tier: 'common', usageWindow: '6m' });
  expect(names(sixMonths)).toEqual(['older']);
  expect(sixMonths.selected[0].usage).toMatchObject({ rate: 5.5, usageWindow: '6m' });
});

test('selectTier keeps an item the runner will refuse in every tier', async () => {
  const broken = { filePath: filePath('broken.yaml'), journeyIndex: 0, error: 'Invalid YAML: x' };
  const selected = entries(
    item({ file: 'a.yaml', name: 'top', sessions: 300 }),
    item({ file: 'b.yaml', name: 'low', sessions: 30 }),
    broken
  );
  const result = await selectTier({ context, selected, tier: 'common', usageWindow: '3m' });
  expect(result.selected.map((entry) => entry.item)).toEqual([
    expect.objectContaining({ journey: expect.objectContaining({ name: 'top' }) }),
    broken,
  ]);
});
