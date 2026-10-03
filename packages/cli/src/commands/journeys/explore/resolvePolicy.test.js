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
import resolvePolicy from './resolvePolicy.js';

test('readCallCost reads the Gateway cost when reported and estimates it otherwise', () => {
  expect(
    readCallCost({
      usage: { inputTokens: 1000, outputTokens: 10 },
      providerMetadata: { gateway: { cost: '0.00012' } },
    })
  ).toEqual({ inputTokens: 1000, outputTokens: 10, usd: 0.00012, estimated: false });
  const estimated = readCallCost({
    usage: { inputTokens: { total: 2000 }, outputTokens: { total: 50 } },
  });
  expect(estimated).toMatchObject({ inputTokens: 2000, outputTokens: 50, estimated: true });
  expect(estimated.usd).toBeCloseTo(0.002 + 0.0002, 10);
});

test('resolvePolicy uses the model policy with the default model when a key is set, and seeded without one', () => {
  expect(resolvePolicy({ options: {}, env: { AI_GATEWAY_API_KEY: 'k' } })).toEqual({
    policy: 'model',
    backend: 'structured-output',
    modelId: 'google/gemini-2.5-flash-lite',
    apiKey: 'k',
    maxCost: 1,
  });
  expect(resolvePolicy({ options: {}, env: {} })).toEqual({
    policy: 'seeded',
    backend: null,
    modelId: null,
    apiKey: null,
    maxCost: 1,
  });
});

test('resolvePolicy takes --model, then LOWDEFY_EXPLORER_MODEL, and --max-cost', () => {
  const env = { AI_GATEWAY_API_KEY: 'k', LOWDEFY_EXPLORER_MODEL: 'openai/gpt-5-nano' };
  expect(resolvePolicy({ options: {}, env }).modelId).toEqual('openai/gpt-5-nano');
  expect(resolvePolicy({ options: { model: 'x/y', maxCost: '0.25' }, env })).toMatchObject({
    modelId: 'x/y',
    maxCost: 0.25,
  });
});

test('resolvePolicy makes jev opt-in on the evaluation backend', () => {
  expect(
    resolvePolicy({ options: { policy: 'jev' }, env: { AI_GATEWAY_API_KEY: 'k' } })
  ).toMatchObject({
    policy: 'jev',
    backend: 'evaluation',
    modelId: 'typesafe-ai/jev',
  });
});

test('resolvePolicy refuses a model policy without a key, an unknown policy and a bad cap', () => {
  expect(() => resolvePolicy({ options: { policy: 'model' }, env: {} })).toThrow(
    "--policy model needs AI_GATEWAY_API_KEY in the shell or the app's .env."
  );
  expect(() => resolvePolicy({ options: { policy: 'greedy' }, env: {} })).toThrow(
    '--policy should be one of model, jev, seeded. Received "greedy".'
  );
  expect(() => resolvePolicy({ options: { maxCost: '0' }, env: {} })).toThrow(
    '--max-cost should be a number of US dollars above 0. Received "0".'
  );
});
