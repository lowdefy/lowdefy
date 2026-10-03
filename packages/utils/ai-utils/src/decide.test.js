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

import {
  Experimental_EvaluationMockModelV4 as EvaluationMockModel,
  MockLanguageModelV4,
} from 'ai/test';

import decide from './decide.js';

const questions = {
  next: { choice: 'Which control next', options: { c0: 'click "Assign"', c1: 'fill "Title"' } },
  relevance: { score: 'How close was the last step', levels: ['unrelated', 'near', 'exercises'] },
};
const state = { pageId: 'tickets', role: 'member' };
const gatewayMetadata = { gateway: { cost: '0.00037' } };

function languageModelReplying(output) {
  return new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 5, text: 5, reasoning: undefined },
      },
      providerMetadata: gatewayMetadata,
      warnings: [],
    },
  });
}

test('decide on the structured-output backend returns answers, usage and providerMetadata', async () => {
  const model = languageModelReplying({
    next: { choice: 'c1', confidence: 0.7 },
    relevance: { level: 'near', confidence: 0.6 },
  });
  const result = await decide({ model, backend: 'structured-output', state, questions });
  expect(result.answers).toEqual({
    next: { choice: 'c1', confidence: 0.7, probabilities: null },
    relevance: { level: 'near', index: 1, score: 1, confidence: 0.6, probabilities: null },
  });
  expect(result.usage.inputTokens).toBe(10);
  expect(result.usage.outputTokens).toBe(5);
  expect(result.providerMetadata).toEqual(gatewayMetadata);
  const [, user] = model.doGenerateCalls[0].prompt;
  expect(user.content[0].text).toContain('"pageId": "tickets"');
});

test('decide on the evaluation backend returns answers, usage and providerMetadata', async () => {
  const model = new EvaluationMockModel({
    doEvaluate: async () => ({
      answers: {
        next: { type: 'choice', choice: 'c0', probabilities: { c0: 0.9, c1: 0.1 } },
        relevance: { type: 'score', score: 1.7, probabilities: { 0: 0.1, 1: 0.1, 2: 0.8 } },
      },
      usage: { inputTokens: 40, outputTokens: 2 },
      warnings: [],
      providerMetadata: gatewayMetadata,
    }),
  });
  const result = await decide({ model, backend: 'evaluation', state, questions });
  expect(result.answers.next.choice).toBe('c0');
  expect(result.answers.relevance.level).toBe('exercises');
  expect(result.usage).toMatchObject({ inputTokens: 40, outputTokens: 2 });
  expect(result.providerMetadata).toEqual(gatewayMetadata);
});

test('decide passes call options through to the model', async () => {
  const model = languageModelReplying({
    next: { choice: 'c0', confidence: 0.9 },
    relevance: { level: 'exercises', confidence: 0.9 },
  });
  await decide({
    model,
    backend: 'structured-output',
    state: 'a string state',
    questions,
    options: { maxOutputTokens: 64 },
  });
  expect(model.doGenerateCalls[0].maxOutputTokens).toBe(64);
  expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain('a string state');
});

test('decide throws on an unknown backend', async () => {
  await expect(decide({ model: {}, backend: 'jev', state, questions })).rejects.toThrow(
    'decide backend should be "evaluation" or "structured-output". Received "jev".'
  );
});
