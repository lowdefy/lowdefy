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

import { MockLanguageModelV4 } from 'ai/test';

import decideWithStructuredOutput from './decideWithStructuredOutput.js';

// The real AI SDK against a mock model: the SDK only parses the model's JSON, so
// anything the answer schema promises has to hold after the model replies.
function modelReplying(output) {
  return new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 5, text: 5, reasoning: undefined },
      },
      warnings: [],
    },
  });
}

const request = {
  state: 'My card was charged twice.',
  questions: {
    team: { choice: 'Which team handles this', options: { billing: 'Invoices', tech: null } },
    down: { yesno: 'The service is down' },
    urgency: { score: 'How urgent', levels: ['low', 'high'] },
  },
};

test('decideWithStructuredOutput sends the answer schema and reads back the answers', async () => {
  const model = modelReplying({
    team: { choice: 'billing', confidence: 0.8 },
    down: { answer: false, confidence: 0.75 },
    urgency: { level: 'high', confidence: 0.6 },
  });
  const { answers } = await decideWithStructuredOutput({ model, ...request, options: {} });
  const { responseFormat } = model.doGenerateCalls[0];
  expect(responseFormat.schema.properties.team.properties.choice.enum).toEqual(['billing', 'tech']);
  expect(answers).toEqual({
    team: { choice: 'billing', confidence: 0.8, probabilities: null },
    down: { answer: false, probability: 0.25, confidence: 0.75 },
    urgency: { level: 'high', index: 1, score: 1, confidence: 0.6, probabilities: null },
  });
});

test('decideWithStructuredOutput reads an answer outside the options, levels or booleans as null, confidence included', async () => {
  const model = modelReplying({
    team: { choice: 'sales', confidence: 0.95 },
    down: { answer: 'maybe', confidence: 0.5 },
    urgency: { level: 'critical', confidence: 0.7 },
  });
  const { answers } = await decideWithStructuredOutput({ model, ...request, options: {} });
  // The model's confidence goes with its answer, so a confidence gate holds these back.
  expect(answers).toEqual({
    team: { choice: null, confidence: null, probabilities: null },
    down: { answer: null, probability: null, confidence: null },
    urgency: { level: null, index: null, score: null, confidence: null, probabilities: null },
  });
});
