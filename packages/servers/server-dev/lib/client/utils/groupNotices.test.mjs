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
import groupNotices from './groupNotices.js';

test('groupNotices splits tenant none notices from errors and warnings in order', () => {
  const error = { type: 'ConfigError', message: 'Bad type.' };
  const warning = { type: 'ConfigWarning', message: 'Deprecated.' };
  const notice = { type: 'TenantNoneNotice', level: 'info', message: 'ran unscoped' };
  expect(groupNotices([notice, error, warning])).toEqual({
    entries: [error, warning],
    tenantNotices: [notice],
    runAsNotices: [],
  });
});

test('groupNotices returns empty groups for no entries', () => {
  expect(groupNotices([])).toEqual({ entries: [], tenantNotices: [], runAsNotices: [] });
  expect(groupNotices(undefined)).toEqual({ entries: [], tenantNotices: [], runAsNotices: [] });
});

test('groupNotices keeps other info-level entries with the errors', () => {
  const info = { type: 'OtherNotice', level: 'info', message: 'fyi' };
  expect(groupNotices([info])).toEqual({ entries: [info], tenantNotices: [], runAsNotices: [] });
});

test('groupNotices splits runAs scope notices into their own group', () => {
  const notice = { type: 'RunAsScope', level: 'info', message: 'ran scoped' };
  const error = { type: 'ConfigError', message: 'Bad type.' };
  expect(groupNotices([notice, error])).toEqual({
    entries: [error],
    tenantNotices: [],
    runAsNotices: [notice],
  });
});
