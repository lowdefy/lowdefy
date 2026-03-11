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

import { matchesPattern, isInPatternList } from './matchPattern.js';

describe('matchesPattern', () => {
  test('exact match for simple id', () => {
    expect(matchesPattern('home', 'home')).toBe(true);
  });

  test('exact match for compound id', () => {
    expect(matchesPattern('team-users/users-list', 'team-users/users-list')).toBe(true);
  });

  test('exact match does not match different id', () => {
    expect(matchesPattern('home', 'login')).toBe(false);
  });

  test('single * matches one segment', () => {
    expect(matchesPattern('team-users/users-list', 'team-users/*')).toBe(true);
    expect(matchesPattern('team-users/user-edit', 'team-users/*')).toBe(true);
  });

  test('single * does not match across slash', () => {
    expect(matchesPattern('team-users/sub/deep', 'team-users/*')).toBe(false);
  });

  test('single * matches simple ids', () => {
    expect(matchesPattern('home', '*')).toBe(true);
    expect(matchesPattern('login', '*')).toBe(true);
  });

  test('single * does not match compound ids', () => {
    expect(matchesPattern('team-users/users-list', '*')).toBe(false);
  });

  test('** matches across slashes', () => {
    expect(matchesPattern('team-users/users-list', '**')).toBe(true);
    expect(matchesPattern('team-users/sub/deep', '**')).toBe(true);
    expect(matchesPattern('home', '**')).toBe(true);
  });

  test('prefix wildcard pattern', () => {
    expect(matchesPattern('team-users/settings', '*/settings')).toBe(true);
    expect(matchesPattern('admin/settings', '*/settings')).toBe(true);
    expect(matchesPattern('team-users/list', '*/settings')).toBe(false);
  });

  test('partial segment wildcard', () => {
    expect(matchesPattern('team-users/list', 'team-*/*')).toBe(true);
    expect(matchesPattern('team-admin/edit', 'team-*/*')).toBe(true);
    expect(matchesPattern('admin/edit', 'team-*/*')).toBe(false);
  });
});

describe('isInPatternList', () => {
  test('matches exact id in list', () => {
    expect(isInPatternList('home', ['home', 'login'])).toBe(true);
  });

  test('does not match id not in list', () => {
    expect(isInPatternList('settings', ['home', 'login'])).toBe(false);
  });

  test('matches via wildcard pattern in list', () => {
    expect(isInPatternList('team-users/list', ['home', 'team-users/*'])).toBe(true);
  });

  test('matches with mixed exact and wildcard patterns', () => {
    expect(isInPatternList('home', ['home', 'team-users/*'])).toBe(true);
    expect(isInPatternList('team-users/edit', ['home', 'team-users/*'])).toBe(true);
    expect(isInPatternList('admin/edit', ['home', 'team-users/*'])).toBe(false);
  });

  test('empty pattern list matches nothing', () => {
    expect(isInPatternList('home', [])).toBe(false);
  });
});
