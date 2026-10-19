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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

import createChangeSignal from './createChangeSignal.mjs';

function readSignal(buildDirectory) {
  return Number(fs.readFileSync(path.join(buildDirectory, 'invalidatePages'), 'utf8'));
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('each write gives build/invalidatePages a new, larger value, even within one millisecond', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-change-signal-'));
  jest.spyOn(Date, 'now').mockReturnValue(5000);
  const writeChangeSignal = createChangeSignal({ buildDirectory });

  expect(writeChangeSignal()).toBe(5000);
  expect(readSignal(buildDirectory)).toBe(5000);
  expect(writeChangeSignal()).toBe(5001);
  expect(readSignal(buildDirectory)).toBe(5001);
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('a new manager continues above the value the last one wrote', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-change-signal-'));
  fs.writeFileSync(path.join(buildDirectory, 'invalidatePages'), '9000');
  jest.spyOn(Date, 'now').mockReturnValue(5000);

  expect(createChangeSignal({ buildDirectory })()).toBe(9001);
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('the value is the current time when the clock is ahead of the last value', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-change-signal-'));
  const writeChangeSignal = createChangeSignal({ buildDirectory });
  jest.spyOn(Date, 'now').mockReturnValue(5000);
  writeChangeSignal();
  Date.now.mockReturnValue(7000);

  expect(writeChangeSignal()).toBe(7000);
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});
