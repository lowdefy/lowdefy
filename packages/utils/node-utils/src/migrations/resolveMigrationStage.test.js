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
import resolveMigrationStage from './resolveMigrationStage.js';

test('resolveMigrationStage prefers an explicit stage over STAGE in the environment', () => {
  expect(resolveMigrationStage({ stage: 'sandbox', env: { STAGE: 'prod' } })).toBe('sandbox');
});

test('resolveMigrationStage reads STAGE from the environment and trims it', () => {
  expect(resolveMigrationStage({ env: { STAGE: ' prod ' } })).toBe('prod');
});

test('resolveMigrationStage returns local for a dev build when nothing names the stage', () => {
  expect(resolveMigrationStage({ env: {}, buildStage: 'dev' })).toBe('local');
  expect(resolveMigrationStage({ env: { STAGE: '' }, buildStage: 'dev' })).toBe('local');
});

test('resolveMigrationStage returns null for a prod build when nothing names the stage', () => {
  expect(resolveMigrationStage({ env: {} })).toBeNull();
  expect(resolveMigrationStage({ env: { STAGE: '   ' }, buildStage: 'prod' })).toBeNull();
});

test('resolveMigrationStage rejects a stage that is not a safe file and environment name', () => {
  expect(() => resolveMigrationStage({ stage: '../prod', env: {} })).toThrow(
    'is not a valid stage name'
  );
  expect(() => resolveMigrationStage({ env: { STAGE: 'pr od' } })).toThrow(
    'is not a valid stage name'
  );
  expect(() => resolveMigrationStage({ stage: 42, env: {} })).toThrow('must be a string');
});
