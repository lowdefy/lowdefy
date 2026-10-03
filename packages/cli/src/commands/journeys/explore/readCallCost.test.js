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

import readCallCost from './readCallCost.js';

const questions = {
  next: { choice: 'Which option?', options: { o1: 'Open', o2: 'Save' } },
  relevance: { score: 'How close?', levels: ['far', 'near'] },
};
const state = { page: 'tickets' };

test('readCallCost uses the cost the Gateway reports', () => {
  expect(
    readCallCost({
      usage: { inputTokens: 3200, outputTokens: 30 },
      providerMetadata: { gateway: { cost: '0.0004' } },
      state,
      questions,
    })
  ).toEqual({ inputTokens: 3200, outputTokens: 30, usd: 0.0004, estimated: false });
});

test('readCallCost estimates cost from reported tokens when no cost is reported', () => {
  const cost = readCallCost({
    usage: { inputTokens: { total: 3200 }, outputTokens: 30 },
    providerMetadata: undefined,
    state,
    questions,
  });
  expect(cost.inputTokens).toEqual(3200);
  expect(cost.outputTokens).toEqual(30);
  expect(cost.estimated).toBe(true);
  expect(cost.usd).toBeCloseTo(3200 / 1e6 + (30 * 4) / 1e6, 10);
});

test('readCallCost charges the per-question floor when neither cost nor tokens are reported', () => {
  const cost = readCallCost({ usage: undefined, providerMetadata: undefined, state, questions });
  expect(cost.inputTokens).toEqual(0);
  expect(cost.outputTokens).toEqual(0);
  expect(cost.estimated).toBe(true);
  expect(cost.usd).toBeCloseTo((2 * 4000) / 1e6 + (2 * 50 * 4) / 1e6, 10);
});

test('readCallCost charges a large prompt by its size when tokens are not reported', () => {
  const largeState = { text: 'x'.repeat(40_000) };
  const cost = readCallCost({
    usage: { inputTokens: undefined, outputTokens: undefined },
    providerMetadata: {},
    state: largeState,
    questions,
  });
  const promptTokens = Math.ceil(JSON.stringify({ state: largeState, questions }).length / 4);
  expect(promptTokens).toBeGreaterThan(2 * 4000);
  expect(cost.usd).toBeCloseTo(promptTokens / 1e6 + (2 * 50 * 4) / 1e6, 10);
});
