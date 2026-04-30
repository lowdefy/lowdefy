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

import { isImmutableRef } from './fetchGitHubModule.js';

describe('isImmutableRef', () => {
  test('returns true for full commit SHA', () => {
    expect(isImmutableRef('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')).toBe(true);
  });

  test('returns true for abbreviated commit SHA (7 chars)', () => {
    expect(isImmutableRef('a1b2c3d')).toBe(true);
  });

  test('returns true for semver tag v1.0.0', () => {
    expect(isImmutableRef('v1.0.0')).toBe(true);
  });

  test('returns true for semver tag without v prefix', () => {
    expect(isImmutableRef('1.0.0')).toBe(true);
  });

  test('returns true for major-only tag v1', () => {
    expect(isImmutableRef('v1')).toBe(true);
  });

  test('returns true for major.minor tag v1.2', () => {
    expect(isImmutableRef('v1.2')).toBe(true);
  });

  test('returns true for prerelease tag v1.0.0-beta.1', () => {
    expect(isImmutableRef('v1.0.0-beta.1')).toBe(true);
  });

  test('returns false for branch name main', () => {
    expect(isImmutableRef('main')).toBe(false);
  });

  test('returns false for branch name develop', () => {
    expect(isImmutableRef('develop')).toBe(false);
  });

  test('returns false for branch name feature/my-feature', () => {
    expect(isImmutableRef('feature/my-feature')).toBe(false);
  });

  test('returns false for branch name with numbers like release-2', () => {
    // Contains non-hex chars so not a SHA, and no dots so not a semver pattern
    expect(isImmutableRef('release-2')).toBe(false);
  });

  test('returns false for short hex string below 7 chars', () => {
    expect(isImmutableRef('a1b2c3')).toBe(false);
  });
});
