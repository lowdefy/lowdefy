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

import buildGenerateCallOptions from './buildGenerateCallOptions.js';

test('buildGenerateCallOptions throws when neither prompt nor messages is provided', () => {
  expect(() => buildGenerateCallOptions({ request: { model: 'test-model' } })).toThrow(
    'Either "prompt" or "messages" must be provided.'
  );
});

test('buildGenerateCallOptions throws when both prompt and messages are provided', () => {
  expect(() =>
    buildGenerateCallOptions({
      request: { prompt: 'Hello', messages: [{ role: 'user', content: 'Hello' }] },
    })
  ).toThrow('Only one of "prompt" or "messages" may be provided, not both.');
});

test('buildGenerateCallOptions maps a prompt-only request', () => {
  expect(buildGenerateCallOptions({ request: { prompt: 'Hello' } })).toEqual({
    prompt: 'Hello',
  });
});

test('buildGenerateCallOptions maps a messages-only request', () => {
  const messages = [{ role: 'user', content: 'Hello' }];
  expect(buildGenerateCallOptions({ request: { messages } })).toEqual({ messages });
});

test('buildGenerateCallOptions copies all defined call settings and omits undefined ones', () => {
  const request = {
    prompt: 'Hello',
    system: 'You are helpful.',
    maxOutputTokens: 100,
    temperature: 0.5,
    topP: 0.9,
    topK: 40,
    frequencyPenalty: 0.1,
    presencePenalty: 0.2,
    seed: 42,
    stopSequences: ['END'],
    maxRetries: 3,
    providerOptions: { anthropic: { thinking: { type: 'enabled' } } },
  };
  expect(buildGenerateCallOptions({ request })).toEqual(request);
});

test('buildGenerateCallOptions ignores unrelated request properties', () => {
  expect(
    buildGenerateCallOptions({
      request: { prompt: 'Hello', model: 'test-model', schema: { type: 'object' } },
    })
  ).toEqual({ prompt: 'Hello' });
});
