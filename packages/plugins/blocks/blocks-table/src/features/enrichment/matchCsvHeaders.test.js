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

import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import getInputColumns from './getInputColumns.js';
import getTextSimilarity from './getTextSimilarity.js';
import matchCsvHeaders, { NEW_COLUMN, SKIP_COLUMN } from './matchCsvHeaders.js';
import normalizeHeader from './normalizeHeader.js';

const { columns } = normalizeColumns({
  columns: [
    { key: 'name', title: 'Person', kind: 'input' },
    { key: 'company', title: 'Company', kind: 'input' },
    { key: 'domain', title: 'Company domain', kind: 'input' },
    { key: 'job_title', title: 'Job title', kind: 'input' },
    { key: 'email', title: 'Email', kind: 'input' },
    { key: 'industry', title: 'Industry', kind: 'input' },
  ],
});
const inputColumns = getInputColumns(columns);
const targets = (headers) =>
  matchCsvHeaders({ headers, columns: inputColumns }).map((match) => match.target);

test('normalizeHeader lowercases and drops accents, case changes and punctuation', () => {
  expect(normalizeHeader('E-mail')).toBe('e mail');
  expect(normalizeHeader('  job_title ')).toBe('job title');
  expect(normalizeHeader('firstName')).toBe('first name');
  expect(normalizeHeader('Société')).toBe('societe');
  expect(normalizeHeader(undefined)).toBe('');
});

test('getTextSimilarity scores close spellings high and unrelated words low', () => {
  expect(getTextSimilarity('email', 'email')).toBe(1);
  expect(getTextSimilarity('emails', 'email')).toBeCloseTo(0.83, 2);
  expect(getTextSimilarity('industy', 'industry')).toBe(0.875);
  expect(getTextSimilarity('notes', 'email')).toBeLessThan(0.5);
  expect(getTextSimilarity('', '')).toBe(0);
});

test('matchCsvHeaders matches a key or title ignoring case, spaces and punctuation', () => {
  expect(
    matchCsvHeaders({ headers: ['JOB-TITLE', 'company domain', ''], columns: inputColumns })
  ).toEqual([
    { target: 'job_title', reason: 'exact' },
    { target: 'domain', reason: 'exact' },
    { target: SKIP_COLUMN, reason: null },
  ]);
});

test('matchCsvHeaders matches common synonyms', () => {
  expect(
    matchCsvHeaders({
      headers: ['Full name', 'Employer', 'Website', 'Role', 'E-mail'],
      columns: inputColumns,
    })
  ).toEqual([
    { target: 'name', reason: 'synonym' },
    { target: 'company', reason: 'synonym' },
    { target: 'domain', reason: 'synonym' },
    { target: 'job_title', reason: 'synonym' },
    // Without its punctuation, "E-mail" is the email column's own key.
    { target: 'email', reason: 'exact' },
  ]);
  expect(targets(['Organisation', 'URL', 'Title', 'Email address', 'Name'])).toEqual([
    'company',
    'domain',
    'job_title',
    'email',
    'name',
  ]);
});

test('matchCsvHeaders matches close spellings above the similarity threshold', () => {
  expect(matchCsvHeaders({ headers: ['Industy', 'Emails'], columns: inputColumns })).toEqual([
    { target: 'industry', reason: 'similar' },
    { target: 'email', reason: 'similar' },
  ]);
  expect(targets(['Lead source', 'Notes'])).toEqual([NEW_COLUMN, NEW_COLUMN]);
});

test('matchCsvHeaders gives each column to its best header, once', () => {
  // "Company" is exact for the company column, so "Employer" (a synonym) does not take it.
  expect(targets(['Employer', 'Company'])).toEqual([NEW_COLUMN, 'company']);
  expect(targets(['email', 'Email'])).toEqual(['email', NEW_COLUMN]);
});
