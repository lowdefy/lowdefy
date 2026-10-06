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

import { jest } from '@jest/globals';

import createCostTracker from './createCostTracker.js';
import readCallCost from './readCallCost.js';

test('the cap trips on reported cost', () => {
  const costs = createCostTracker({ maxCost: 0.001 });
  costs.add({
    asked: true,
    usage: { inputTokens: 4000, outputTokens: 30 },
    cost: { usd: 0.0006, estimated: false },
  });
  expect(costs.exceeded()).toBe(false);
  costs.add({
    asked: true,
    usage: { inputTokens: 4000, outputTokens: 30 },
    cost: { usd: 0.0006, estimated: false },
  });
  expect(costs.exceeded()).toBe(true);
  expect(costs.totals()).toEqual({
    calls: 2,
    failedCalls: 0,
    inputTokens: 8000,
    outputTokens: 60,
    usd: 0.0012,
    estimatedUsd: 0,
  });
});

test('the cap trips on estimated cost from tokens when the model reports none, and warns once', () => {
  const onFirstEstimate = jest.fn();
  const costs = createCostTracker({ maxCost: 0.01, onFirstEstimate });
  // A mock model that reports tokens but no Gateway cost.
  const { usd, estimated } = readCallCost({
    usage: { inputTokens: 4000, outputTokens: 40 },
    providerMetadata: {},
    state: {},
    questions: { next: {} },
  });
  expect(estimated).toBe(true);
  for (let call = 0; call < 3; call += 1) {
    costs.add({
      asked: true,
      usage: { inputTokens: 4000, outputTokens: 40 },
      cost: { usd, estimated },
    });
  }
  expect(costs.exceeded()).toBe(true);
  expect(onFirstEstimate).toHaveBeenCalledTimes(1);
});

test('answers that asked nothing cost nothing, and failed calls are counted apart', () => {
  const costs = createCostTracker({ maxCost: 1 });
  costs.add({ asked: false, optionId: 'o0' });
  costs.add({ asked: true, fallback: 'failed', optionId: 'o1' });
  expect(costs.totals()).toEqual(expect.objectContaining({ calls: 0, failedCalls: 1, usd: 0 }));
});

test('a failed call with an estimated cost counts toward the cap and warns once', () => {
  const onFirstEstimate = jest.fn();
  const costs = createCostTracker({ maxCost: 0.01, onFirstEstimate });
  costs.add({
    asked: true,
    fallback: 'failed',
    optionId: 'o1',
    usage: { inputTokens: 0, outputTokens: 0 },
    cost: { usd: 0.006, estimated: true },
  });
  expect(costs.exceeded()).toBe(false);
  costs.add({ asked: true, fallback: 'failed', optionId: 'o2' });
  costs.add({
    asked: true,
    fallback: 'failed',
    optionId: 'o0',
    usage: { inputTokens: 0, outputTokens: 0 },
    cost: { usd: 0.006, estimated: true },
  });
  expect(costs.exceeded()).toBe(true);
  expect(onFirstEstimate).toHaveBeenCalledTimes(1);
  expect(costs.totals()).toEqual(
    expect.objectContaining({ calls: 0, failedCalls: 3, usd: 0.012, estimatedUsd: 0.012 })
  );
});
