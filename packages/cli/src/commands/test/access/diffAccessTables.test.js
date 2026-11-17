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

import diffAccessTables from './diffAccessTables.js';

function table({ pages = {}, endpoints = {} } = {}) {
  return { data: 'roles', pages, endpoints };
}

const row = { finance: 'allow', 'no-role': 'deny', none: 'deny' };

test('diffAccessTables returns no lines for identical tables', () => {
  const expected = table({ pages: { billing: row }, endpoints: { approve: row } });
  const actual = table({ pages: { billing: { ...row } }, endpoints: { approve: { ...row } } });
  expect(diffAccessTables({ expected, actual })).toEqual([]);
});

test('diffAccessTables names each changed cell with its old and new outcome', () => {
  const expected = table({ pages: { billing: row }, endpoints: { approve: row } });
  const actual = table({
    pages: { billing: { ...row, 'no-role': 'allow' } },
    endpoints: { approve: { ...row, finance: 'enrol_required' } },
  });
  expect(diffAccessTables({ expected, actual })).toEqual([
    'pages.billing.no-role: deny → allow',
    'endpoints.approve.finance: allow → enrol_required',
  ]);
});

test('diffAccessTables gives one line for an added or removed row, not one per cell', () => {
  const expected = table({ pages: { billing: row, old: row } });
  const actual = table({ pages: { billing: row, reports: row }, endpoints: { approve: row } });
  expect(diffAccessTables({ expected, actual })).toEqual([
    'pages.old: removed',
    'pages.reports: added',
    'endpoints.approve: added',
  ]);
});

test('diffAccessTables gives one line for an added or removed caller, not one per row', () => {
  const expected = table({ pages: { billing: row, reports: row } });
  const withoutFinance = { 'no-role': 'deny', none: 'deny' };
  const actual = table({
    pages: {
      billing: { ...withoutFinance, technician: 'deny' },
      reports: { ...withoutFinance, technician: 'allow' },
    },
  });
  expect(diffAccessTables({ expected, actual })).toEqual([
    'caller finance: removed',
    'caller technician: added',
  ]);
});

test('diffAccessTables lists cell changes beside an added caller', () => {
  const expected = table({ pages: { billing: row } });
  const actual = table({ pages: { billing: { ...row, none: 'allow', technician: 'deny' } } });
  expect(diffAccessTables({ expected, actual })).toEqual([
    'caller technician: added',
    'pages.billing.none: deny → allow',
  ]);
});
