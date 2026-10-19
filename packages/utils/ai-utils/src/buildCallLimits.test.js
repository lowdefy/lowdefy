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

import { Experimental_EvaluationMockModelV4, MockLanguageModelV4 } from 'ai/test';
import { ServiceError } from '@lowdefy/errors';

import buildCallLimits from './buildCallLimits.js';
import createDecide from './createDecide.js';
import createGenerateObject from './createGenerateObject.js';
import createGenerateText from './createGenerateText.js';

test.each([
  [
    'the request limits over the connection defaults',
    { maxOutputTokens: 100, timeout: 5000 },
    { model: 'm', maxOutputTokens: 20, timeout: 1000 },
    { maxOutputTokens: 20, timeout: 1000 },
  ],
  [
    'the connection defaults when the request sets none',
    { maxOutputTokens: 100, timeout: 5000 },
    { model: 'm' },
    { maxOutputTokens: 100, timeout: 5000 },
  ],
  ['no limits when neither sets any', {}, { model: 'm' }, {}],
])('buildCallLimits takes %s', (_, connection, request, expected) => {
  expect(buildCallLimits({ connection, request })).toEqual(expected);
});

test('buildCallLimits passes the request signal as the abort signal', () => {
  const signal = new AbortController().signal;
  expect(buildCallLimits({ connection: {}, request: {}, signal })).toEqual({
    abortSignal: signal,
  });
});

// The real AI SDK against mock models: the limits have to reach the provider call.
const REPLY = JSON.stringify({ ok: { answer: true, confidence: 0.9 } });

function replyingModel() {
  return new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: 'text', text: REPLY }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 5, text: 5, reasoning: undefined },
      },
      warnings: [],
    },
  });
}

// A provider call that only ends when its abort signal fires, as a fetch does.
function untilAborted({ abortSignal }) {
  return new Promise((resolve, reject) => {
    if (abortSignal.aborted) {
      reject(abortSignal.reason);
      return;
    }
    abortSignal.addEventListener('abort', () => reject(abortSignal.reason), { once: true });
  });
}

// `started` resolves once the provider call is in flight, so a test can close the
// request mid-call.
function hangingModel() {
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const model = new MockLanguageModelV4({
    doGenerate: (options) => {
      markStarted();
      return untilAborted(options);
    },
  });
  return { model, started };
}

function hangingEvaluationModel() {
  return new Experimental_EvaluationMockModelV4({ doEvaluate: untilAborted });
}

function providerFor({ model, evaluationModel }) {
  const provider = () => model;
  provider.evaluationModel = () => evaluationModel;
  return () => provider;
}

const resolvers = [
  [
    'GenerateText',
    ({ createProvider }) => createGenerateText({ createProvider }),
    { prompt: 'Hi' },
  ],
  [
    'GenerateObject',
    ({ createProvider }) => createGenerateObject({ createProvider }),
    { prompt: 'Hi', schema: { type: 'object' } },
  ],
  [
    'Decide',
    ({ createProvider }) => createDecide({ createProvider }),
    { state: 'A state', questions: { ok: { yesno: 'It is ok' } } },
  ],
];

test.each(resolvers)(
  '%s sends the connection maxOutputTokens to the provider call',
  async (_, create, properties) => {
    const model = replyingModel();
    const resolver = create({ createProvider: providerFor({ model }) });
    await resolver({
      connection: { maxOutputTokens: 256 },
      request: { model: 'm', ...properties },
    });
    expect(model.doGenerateCalls[0].maxOutputTokens).toBe(256);
  }
);

test.each(resolvers)(
  '%s cancels the provider call when the request closes',
  async (_, create, properties) => {
    const { model, started } = hangingModel();
    const resolver = create({ createProvider: providerFor({ model }) });
    const request = new AbortController();
    const pending = resolver({
      connection: {},
      request: { model: 'm', ...properties },
      signal: request.signal,
    });
    await started;
    request.abort(new DOMException('The client closed the connection.', 'AbortError'));
    const error = await pending.catch((e) => e);
    expect(error.name).toBe('AbortError');
  }
);

test.each(resolvers)(
  '%s cancels the provider call at the connection timeout, as a service error',
  async (_, create, properties) => {
    const { model } = hangingModel();
    const resolver = create({ createProvider: providerFor({ model }) });
    const error = await resolver({
      connection: { timeout: 20 },
      request: { model: 'm', maxRetries: 0, ...properties },
    }).catch((e) => e);
    expect(error.name).toBe('TimeoutError');
    expect(ServiceError.isServiceError(error)).toBe(true);
  }
);

test('Decide on the evaluation backend cancels the evaluation when the request closes or times out', async () => {
  const Decide = createDecide({
    createProvider: providerFor({ evaluationModel: hangingEvaluationModel() }),
    backends: ['evaluation'],
  });
  const properties = { model: 'm', maxRetries: 0, state: 'A', questions: { ok: { yesno: 'Ok' } } };

  const request = new AbortController();
  const pending = Decide({ connection: {}, request: properties, signal: request.signal });
  request.abort(new DOMException('The client closed the connection.', 'AbortError'));
  expect((await pending.catch((e) => e)).name).toBe('AbortError');

  const timedOut = await Decide({ connection: {}, request: { ...properties, timeout: 20 } }).catch(
    (e) => e
  );
  expect(timedOut.name).toBe('TimeoutError');
});
