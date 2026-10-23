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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import takeJourneyRunSlots from './takeJourneyRunSlots.js';

const originalExitCode = process.exitCode;
let context;
let errors;

beforeEach(() => {
  process.exitCode = undefined;
  errors = [];
  context = { logger: { error: (line) => errors.push(line) }, sendTelemetry: vi.fn() };
});

afterEach(() => {
  process.exitCode = originalExitCode;
});

test('takeJourneyRunSlots returns the slots it took', async () => {
  const slots = { release: vi.fn() };
  const acquire = vi.fn(async () => slots);
  expect(await takeJourneyRunSlots({ context, command: 'lowdefy test', acquire })).toBe(slots);
  expect(acquire).toHaveBeenCalledWith({ context, command: 'lowdefy test' });
  expect(process.exitCode).toBeUndefined();
});

test('takeJourneyRunSlots says the machine is busy and sets exit code 75 when the wait runs out', async () => {
  const acquire = vi.fn(async () => {
    throw Object.assign(new Error('busy'), { code: 'MACHINE_SLOT_TIMEOUT' });
  });
  expect(await takeJourneyRunSlots({ context, command: 'lowdefy test', acquire })).toBeNull();
  expect(errors).toEqual([
    'The machine is busy running other journeys. Try again later; do not start your own dev server.',
  ]);
  expect(process.exitCode).toBe(75);
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('takeJourneyRunSlots passes other errors on', async () => {
  const failure = new Error('disk full');
  const acquire = vi.fn(async () => {
    throw failure;
  });
  await expect(takeJourneyRunSlots({ context, command: 'lowdefy test', acquire })).rejects.toBe(
    failure
  );
  expect(process.exitCode).toBeUndefined();
});
