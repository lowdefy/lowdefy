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
import { validate } from '@lowdefy/ajv';

const mockEvaluate = jest.fn();
const mockGenerateText = jest.fn();
const mockJsonSchema = jest.fn((schema) => ({ wrapped: schema }));
const mockOutputObject = jest.fn((spec) => ({ outputSpec: spec }));

jest.unstable_mockModule('ai', () => ({
  experimental_evaluate: mockEvaluate,
  generateText: mockGenerateText,
  jsonSchema: mockJsonSchema,
  Output: { object: mockOutputObject },
}));

beforeEach(() => {
  mockEvaluate.mockReset();
  mockGenerateText.mockReset();
  mockJsonSchema.mockClear();
  mockOutputObject.mockClear();
});

const questions = {
  team: {
    choice: 'Which team handles this',
    options: { billing: 'Invoices and payments', tech: 'Outages and bugs', sales: null },
  },
  down: {
    yesno: 'The customer says the service is down',
    criteria: { yes: 'an outage is reported' },
  },
  urgency: { score: 'How urgent is this', levels: ['low', 'medium', 'high'] },
};
const state = { subject: 'Charged twice', body: 'My card was charged twice for one order.' };

function gateway() {
  const languageModel = { modelId: 'language' };
  const evaluationModel = { modelId: 'evaluation' };
  const provider = jest.fn().mockReturnValue(languageModel);
  provider.evaluationModel = jest.fn().mockReturnValue(evaluationModel);
  return { provider, languageModel, evaluationModel };
}

test('createDecide attaches a per-connection schema and meta', async () => {
  const { default: createDecide } = await import('./createDecide.js');
  const Decide = createDecide({
    createProvider: jest.fn(),
    backends: ['evaluation', 'structured-output'],
  });
  expect(Decide.meta).toEqual({ checkRead: false, checkWrite: false });
  expect(Decide.schema.title).toBe('Lowdefy Request Schema - Decide');
  expect(Decide.schema.properties.backend.enum).toEqual(['evaluation', 'structured-output']);
  expect(createDecide({ createProvider: jest.fn() }).schema.properties.backend.enum).toEqual([
    'structured-output',
  ]);
});

test('Decide on the evaluation backend asks an evaluation model and shapes its answers', async () => {
  const { default: createDecide } = await import('./createDecide.js');
  const { provider, evaluationModel } = gateway();
  mockEvaluate.mockResolvedValue({
    answers: {
      team: {
        type: 'choice',
        choice: 'billing',
        probabilities: { billing: 0.9, tech: 0.06, sales: 0.04 },
      },
      down: { type: 'boolean', probability: 0.1 },
      urgency: { type: 'score', score: 0.7, probabilities: { 0: 0.4, 1: 0.5, 2: 0.1 } },
    },
    usage: { inputTokens: 300, outputTokens: 12, totalTokens: 312 },
    providerMetadata: { typesafe: { confidence: { team: 0.88 } } },
  });
  const Decide = createDecide({
    createProvider: () => provider,
    backends: ['evaluation', 'structured-output'],
  });

  const result = await Decide({
    connection: { apiKey: 'k' },
    request: {
      model: 'typesafe-ai/jev',
      state,
      questions,
      maxRetries: 1,
      providerOptions: { gateway: { zeroDataRetention: true } },
    },
  });

  expect(provider.evaluationModel).toHaveBeenCalledWith('typesafe-ai/jev');
  expect(mockEvaluate).toHaveBeenCalledWith({
    model: evaluationModel,
    state,
    questions: {
      team: {
        type: 'choice',
        instructions: 'Which team handles this',
        criteria: questions.team.options,
      },
      down: {
        type: 'boolean',
        instructions: 'The customer says the service is down',
        criteria: { true: 'an outage is reported', false: null },
      },
      urgency: {
        type: 'score',
        instructions: 'How urgent is this',
        criteria: ['low', 'medium', 'high'],
      },
    },
    maxRetries: 1,
    providerOptions: { gateway: { zeroDataRetention: true } },
  });
  expect(result).toEqual({
    // The provider's calibrated confidence wins where it reports one.
    team: {
      choice: 'billing',
      confidence: 0.88,
      probabilities: { billing: 0.9, tech: 0.06, sales: 0.04 },
    },
    down: { answer: false, probability: 0.1, confidence: 0.9 },
    urgency: {
      level: 'medium',
      index: 1,
      score: 0.7,
      confidence: 0.5,
      probabilities: { low: 0.4, medium: 0.5, high: 0.1 },
    },
    usage: { inputTokens: 300, outputTokens: 12, totalTokens: 312 },
  });
});

test('Decide on the structured-output backend asks a language model for a schema-checked object', async () => {
  const { default: createDecide } = await import('./createDecide.js');
  const { provider, languageModel } = gateway();
  mockGenerateText.mockResolvedValue({
    output: {
      team: { choice: 'tech', confidence: 0.7 },
      down: { answer: true, confidence: 0.8 },
      urgency: { level: 'high', confidence: 1.4 },
    },
    usage: { inputTokens: 500, outputTokens: 40, totalTokens: 540 },
  });
  const Decide = createDecide({ createProvider: () => provider });

  const result = await Decide({
    connection: {},
    request: { model: 'anthropic/claude-haiku-4.5', state: 'The site is down!', questions },
  });

  expect(provider).toHaveBeenCalledWith('anthropic/claude-haiku-4.5');
  const call = mockGenerateText.mock.calls[0][0];
  expect(call.model).toBe(languageModel);
  expect(call.instructions).toContain('calibrated');
  expect(call.prompt).toContain('## STATE\nThe site is down!');
  expect(call.prompt).toContain(
    '- team (pick one option): Which team handles this\n    - billing: Invoices and payments'
  );
  expect(call.prompt).toContain('    - sales');
  const schema = mockJsonSchema.mock.calls[0][0];
  expect(schema.required).toEqual(['team', 'down', 'urgency']);
  expect(schema.properties.team.properties.choice.enum).toEqual(['billing', 'tech', 'sales']);
  expect(schema.properties.down.properties.answer).toEqual({ type: 'boolean' });
  expect(schema.properties.urgency.properties.level.enum).toEqual(['low', 'medium', 'high']);
  expect(result).toEqual({
    team: { choice: 'tech', confidence: 0.7, probabilities: null },
    down: { answer: true, probability: 0.8, confidence: 0.8 },
    // Confidence is clamped to [0, 1].
    urgency: { level: 'high', index: 2, score: 2, confidence: 1, probabilities: null },
    usage: { inputTokens: 500, outputTokens: 40, totalTokens: 540 },
  });
});

test('Decide backend property picks structured output on a connection that defaults to evaluation', async () => {
  const { default: createDecide } = await import('./createDecide.js');
  const { provider } = gateway();
  mockGenerateText.mockResolvedValue({ output: {}, usage: {} });
  const Decide = createDecide({
    createProvider: () => provider,
    backends: ['evaluation', 'structured-output'],
  });
  const result = await Decide({
    connection: {},
    request: { model: 'openai/gpt-5-mini', backend: 'structured-output', state: 'x', questions },
  });
  expect(mockEvaluate).not.toHaveBeenCalled();
  expect(provider.evaluationModel).not.toHaveBeenCalled();
  // A missing answer reads back as nulls, never a crash.
  expect(result.team).toEqual({ choice: null, confidence: null, probabilities: null });
  expect(result.down).toEqual({ answer: null, probability: null, confidence: null });
});

test('Decide schema validates each question shape', async () => {
  const { default: decideSchema } = await import('./DecideSchema.js');
  const schema = decideSchema({ backends: ['evaluation', 'structured-output'] });
  expect(validate({ schema, data: { model: 'm', state, questions } })).toEqual({ valid: true });
  expect(validate({ schema, data: { model: 'm', state: ['a', 'b'], questions } })).toEqual({
    valid: true,
  });
});

test('Decide schema rejects a malformed question', async () => {
  const { default: decideSchema } = await import('./DecideSchema.js');
  const schema = decideSchema({ backends: ['structured-output'] });
  expect(() =>
    validate({
      schema,
      data: { model: 'm', state: 'x', questions: { team: { choice: 'Which?' } } },
    })
  ).toThrow(
    'Decide questions should be one of { choice, options }, { yesno, criteria? } or { score, levels }.'
  );
  expect(() =>
    validate({
      schema,
      data: {
        model: 'm',
        state: 'x',
        questions: { team: { choice: 'Which?', options: { only: 'one' } } },
      },
    })
  ).toThrow('Decide questions should be one of');
});

test('Decide schema reserves the usage question id', async () => {
  const { default: decideSchema } = await import('./DecideSchema.js');
  const schema = decideSchema({ backends: ['structured-output'] });
  expect(() =>
    validate({
      schema,
      data: { model: 'm', state: 'x', questions: { usage: { yesno: 'Is it?' } } },
    })
  ).toThrow('Decide question ids may not be "usage"');
});

test('Decide schema limits backend to what the connection offers', async () => {
  const { default: decideSchema } = await import('./DecideSchema.js');
  const schema = decideSchema({ backends: ['structured-output'] });
  expect(() =>
    validate({ schema, data: { model: 'm', backend: 'evaluation', state: 'x', questions } })
  ).toThrow('Decide request property "backend" should be one of: structured-output.');
});

test('Decide schema requires state and questions', async () => {
  const { default: decideSchema } = await import('./DecideSchema.js');
  const schema = decideSchema({ backends: ['structured-output'] });
  expect(() => validate({ schema, data: { model: 'm', questions } })).toThrow(
    'Decide request should have required property "state".'
  );
  expect(() => validate({ schema, data: { model: 'm', state: 'x', questions: {} } })).toThrow(
    'Decide request property "questions" should have at least one question.'
  );
});
