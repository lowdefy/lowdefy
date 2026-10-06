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
import { collectKnownText, parseDataSet } from '@lowdefy/node-utils';

const mockDecide = jest.fn();
const mockLanguageModel = jest.fn((modelId) => ({ kind: 'language', modelId }));
const mockEvaluationModel = jest.fn((modelId) => ({ kind: 'evaluation', modelId }));
const mockCreateGateway = jest.fn(() =>
  Object.assign(mockLanguageModel, { evaluationModel: mockEvaluationModel })
);
jest.unstable_mockModule('@lowdefy/ai-utils', () => ({ decide: mockDecide }));
jest.unstable_mockModule('@ai-sdk/gateway', () => ({ createGateway: mockCreateGateway }));

const { default: buildDecisionState } = await import('./buildDecisionState.js');
const { default: createModelPolicy } = await import('./createModelPolicy.js');
const { default: createSeededPolicy } = await import('./createSeededPolicy.js');
const { default: createWalkProgress } = await import('./createWalkProgress.js');

const everything = { has: () => true, findIn: () => null };

function click(blockId, text, extra = {}) {
  return {
    kind: 'click',
    target: { blockId, text },
    blockType: 'Button',
    blockIds: [blockId, 'page'],
    label: text,
    ...extra,
  };
}

function observation(candidates, shape = 'aaaa0001') {
  return { pageId: 'tickets', url: '/tickets?id=t-1', shape, candidates };
}

function decisionState({
  candidates,
  progress,
  history = [],
  blockDiff = [],
  knownText = everything,
  shape,
}) {
  return buildDecisionState({
    context: { title: 'Tickets page', body: 'Adds assigning.' },
    pageId: 'tickets',
    role: 'member',
    url: '/tickets?id=t-1&tab=open',
    blockDiff,
    observation: observation(candidates, shape),
    history,
    knownText,
    progress,
    fixtures: {},
  });
}

beforeEach(() => {
  mockDecide.mockReset();
  mockCreateGateway.mockClear();
  mockLanguageModel.mockClear();
  mockEvaluationModel.mockClear();
});

function step({ candidates, firstStep = false }) {
  const progress = createWalkProgress();
  const walkIndex = progress.startWalk();
  const decision = decisionState({ progress, candidates, history: firstStep ? [] : ['x'] });
  return {
    ...decision,
    firstStep,
    pageId: 'tickets',
    role: 'member',
    walkIndex,
    stepIndex: firstStep ? 0 : 1,
  };
}

const three = [click('open', 'Open'), click('save', 'Save'), click('help', 'Help')];

function answers({
  choice,
  level = 'near the change',
  metadata = { gateway: { cost: '0.0004' } },
}) {
  return {
    answers: { next: { choice, confidence: 0.8 }, relevance: { level } },
    usage: { inputTokens: 3200, outputTokens: 30 },
    providerMetadata: metadata,
  };
}

test('the model policy asks the Gateway model and takes the option it names, with relevance and reported cost', async () => {
  const policy = await createModelPolicy({
    backend: 'structured-output',
    modelId: 'google/gemini-2.5-flash-lite',
    apiKey: 'test-key',
    seeded: createSeededPolicy({ seed: 0 }),
  });
  mockDecide.mockResolvedValue(answers({ choice: 'o1' }));
  const result = await policy.choose(step({ candidates: three }));

  expect(mockCreateGateway).toHaveBeenCalledWith({ apiKey: 'test-key' });
  expect(mockLanguageModel).toHaveBeenCalledWith('google/gemini-2.5-flash-lite');
  const [{ model, backend, questions }] = mockDecide.mock.calls[0];
  expect(model).toEqual({ kind: 'language', modelId: 'google/gemini-2.5-flash-lite' });
  expect(backend).toEqual('structured-output');
  expect(Object.keys(questions)).toEqual(['next', 'relevance']);
  expect(questions.relevance.levels).toEqual([
    'unrelated to the change',
    'near the change',
    'exercises the change',
  ]);
  expect(result).toEqual({
    optionId: 'o1',
    asked: true,
    fallback: null,
    modelId: 'google/gemini-2.5-flash-lite',
    relevance: 'near the change',
    confidence: 0.8,
    usage: { inputTokens: 3200, outputTokens: 30 },
    cost: { usd: 0.0004, estimated: false },
  });
});

test('the model policy leaves relevance out on a first step, and takes a single option without asking', async () => {
  const policy = await createModelPolicy({
    backend: 'structured-output',
    modelId: 'm',
    apiKey: 'k',
    seeded: createSeededPolicy(),
  });
  mockDecide.mockResolvedValue(answers({ choice: 'o0' }));
  await policy.choose(step({ candidates: three, firstStep: true }));
  expect(Object.keys(mockDecide.mock.calls[0][0].questions)).toEqual(['next']);
  expect(await policy.choose(step({ candidates: [three[0]] }))).toEqual({
    optionId: 'o0',
    asked: false,
  });
  expect(await policy.choose(step({ candidates: [] }))).toEqual({ optionId: null, asked: false });
  expect(mockDecide).toHaveBeenCalledTimes(1);
});

test('an answer outside the options falls back to the seeded choice and says so; cost is estimated without a report', async () => {
  const seeded = createSeededPolicy({ seed: 3 });
  const policy = await createModelPolicy({
    backend: 'structured-output',
    modelId: 'm',
    apiKey: 'k',
    seeded,
  });
  mockDecide.mockResolvedValue(answers({ choice: 'o99', metadata: null }));
  const decision = step({ candidates: three });
  const result = await policy.choose(decision);
  expect(result.fallback).toEqual('unanswered');
  expect(result.optionId).toEqual(seeded.choose(decision));
  expect(result.cost.estimated).toBe(true);
  expect(result.cost.usd).toBeCloseTo(3200 / 1e6 + (30 * 4) / 1e6, 10);
});

test('a call that reports neither cost nor tokens is charged the per-question floor, estimated', async () => {
  const policy = await createModelPolicy({
    backend: 'evaluation',
    modelId: 'jev',
    apiKey: 'k',
    seeded: createSeededPolicy(),
  });
  mockDecide.mockResolvedValue({
    answers: { next: { choice: 'o1', confidence: 0.8 }, relevance: { level: 'near the change' } },
  });
  const result = await policy.choose(step({ candidates: three }));
  expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  expect(result.cost.estimated).toBe(true);
  expect(result.cost.usd).toBeGreaterThan(0);
  expect(result.cost.usd).toBeGreaterThanOrEqual((2 * 4000) / 1e6 + (2 * 50 * 4) / 1e6);
});

test('failed calls fall back to the seeded choice, and three in a row throw the Gateway error', async () => {
  const policy = await createModelPolicy({
    backend: 'structured-output',
    modelId: 'm',
    apiKey: 'k',
    seeded: createSeededPolicy(),
  });
  const gatewayError = Object.assign(new Error('Gateway is down'), {
    name: 'GatewayInternalServerError',
  });
  mockDecide.mockRejectedValue(gatewayError);
  expect((await policy.choose(step({ candidates: three }))).fallback).toEqual('failed');
  expect((await policy.choose(step({ candidates: three }))).fallback).toEqual('failed');
  await expect(policy.choose(step({ candidates: three }))).rejects.toThrow('Gateway is down');
});

test('a success resets the failed-call count', async () => {
  const policy = await createModelPolicy({
    backend: 'structured-output',
    modelId: 'm',
    apiKey: 'k',
    seeded: createSeededPolicy(),
  });
  const gatewayError = new Error('Gateway is down');
  mockDecide
    .mockRejectedValueOnce(gatewayError)
    .mockRejectedValueOnce(gatewayError)
    .mockResolvedValueOnce(answers({ choice: 'o0' }))
    .mockRejectedValueOnce(gatewayError);
  for (let call = 0; call < 4; call += 1) {
    await policy.choose(step({ candidates: three }));
  }
  expect(mockDecide).toHaveBeenCalledTimes(4);
});

function structuredPolicy() {
  return createModelPolicy({
    backend: 'structured-output',
    modelId: 'm',
    apiKey: 'k',
    seeded: createSeededPolicy(),
  });
}

function retried(lastError) {
  return Object.assign(new Error(`Failed after 3 attempts. Last error: ${lastError.message}`), {
    name: 'AI_RetryError',
    lastError,
    errors: [lastError, lastError, lastError],
  });
}

test('a failed call that may have been billed is charged an estimate, so the cap counts it', async () => {
  const policy = await structuredPolicy();
  const unparsed = Object.assign(new Error('No object generated: response did not match schema.'), {
    name: 'AI_NoObjectGeneratedError',
  });
  mockDecide.mockRejectedValueOnce(retried(unparsed));
  const answer = await policy.choose(step({ candidates: three }));
  expect(answer.fallback).toEqual('failed');
  expect(answer.cost.estimated).toBe(true);
  expect(answer.cost.usd).toBeGreaterThan(0);
  expect(answer.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
});

test('a failed call that carries its usage is charged from those tokens', async () => {
  const policy = await structuredPolicy();
  const unparsed = Object.assign(new Error('No object generated.'), {
    name: 'AI_NoObjectGeneratedError',
    usage: { inputTokens: 1_000_000, outputTokens: 0 },
  });
  mockDecide.mockRejectedValueOnce(unparsed);
  const answer = await policy.choose(step({ candidates: three }));
  expect(answer.usage).toEqual({ inputTokens: 1_000_000, outputTokens: 0 });
  expect(answer.cost).toEqual({ usd: 1, estimated: true });
});

test('a refused model, a network failure or an abort adds no cost', async () => {
  const policy = await structuredPolicy();
  const unreachable = Object.assign(new Error('Gateway request failed'), {
    name: 'GatewayResponseError',
    statusCode: 500,
    cause: Object.assign(new Error('Cannot connect to API: fetch failed'), {
      name: 'AI_APICallError',
      cause: new TypeError('fetch failed'),
    }),
  });
  const aborted = Object.assign(new Error('This operation was aborted'), { name: 'AbortError' });
  mockDecide
    .mockRejectedValueOnce(refused)
    .mockRejectedValueOnce(retried(unreachable))
    .mockResolvedValueOnce(answers({ choice: 'o0' }))
    .mockRejectedValueOnce(aborted);
  const first = await policy.choose(step({ candidates: three }));
  const second = await policy.choose(step({ candidates: three }));
  await policy.choose(step({ candidates: three }));
  const fourth = await policy.choose(step({ candidates: three }));
  for (const answer of [first, second, fourth]) {
    expect(answer.fallback).toEqual('failed');
    expect(answer.cost).toBeUndefined();
  }
});

function jevPolicy(onSwitch = () => {}) {
  return createModelPolicy({
    backend: 'evaluation',
    modelId: 'typesafe-ai/jev',
    fallbackModelId: 'google/gemini-2.5-flash-lite',
    apiKey: 'k',
    seeded: createSeededPolicy(),
    onSwitch,
  });
}

const refused = Object.assign(new Error('Model not found'), {
  name: 'GatewayModelNotFoundError',
  statusCode: 404,
});

test('jev uses the evaluation model, with the structured-output model standing by', async () => {
  const policy = await jevPolicy();
  expect(mockEvaluationModel).toHaveBeenCalledWith('typesafe-ai/jev');
  expect(mockLanguageModel).toHaveBeenCalledWith('google/gemini-2.5-flash-lite');
  expect(policy.name).toEqual('jev');
  expect(policy.fallbackModelId).toEqual('google/gemini-2.5-flash-lite');
  mockDecide.mockResolvedValue(answers({ choice: 'o2' }));
  const answer = await policy.choose(step({ candidates: three }));
  expect(answer).toMatchObject({ optionId: 'o2', fallback: null, modelId: 'typesafe-ai/jev' });
  expect(mockDecide.mock.calls[0][0]).toMatchObject({
    backend: 'evaluation',
    model: { kind: 'evaluation', modelId: 'typesafe-ai/jev' },
  });
  expect(policy.switched()).toBe(null);
});

test('jev refused at any call switches to the fallback for the rest of the run, and says so', async () => {
  const onSwitch = jest.fn();
  const policy = await jevPolicy(onSwitch);
  mockDecide
    .mockResolvedValueOnce(answers({ choice: 'o0' }))
    .mockRejectedValueOnce(refused)
    .mockResolvedValue(answers({ choice: 'o1' }));
  await policy.choose(step({ candidates: three }));
  const switchedAnswer = await policy.choose(step({ candidates: three }));
  expect(switchedAnswer).toMatchObject({
    optionId: 'o1',
    fallback: 'model',
    modelId: 'google/gemini-2.5-flash-lite',
  });
  const later = await policy.choose(step({ candidates: three }));
  expect(later).toMatchObject({ fallback: null, modelId: 'google/gemini-2.5-flash-lite' });
  expect(mockDecide.mock.calls.map(([call]) => call.backend)).toEqual([
    'evaluation',
    'evaluation',
    'structured-output',
    'structured-output',
  ]);
  expect(onSwitch).toHaveBeenCalledTimes(1);
  expect(policy.switched()).toMatchObject({
    from: 'typesafe-ai/jev',
    to: 'google/gemini-2.5-flash-lite',
    reason: 'refused',
  });
});

test('a request jev rejects as over its limits switches to the fallback', async () => {
  const policy = await jevPolicy();
  mockDecide
    .mockRejectedValueOnce(
      Object.assign(new Error('Input exceeds the maximum context of 32768 tokens'), {
        statusCode: 400,
      })
    )
    .mockResolvedValue(answers({ choice: 'o0' }));
  const answer = await policy.choose(step({ candidates: three }));
  expect(answer).toMatchObject({ fallback: 'model', optionId: 'o0' });
  expect(policy.switched().reason).toEqual('over-limit');
});

test('when both models fail, the step falls back to the seeded choice and three failures stop the run', async () => {
  const policy = await jevPolicy();
  const down = Object.assign(new Error('Gateway is down'), { name: 'GatewayInternalServerError' });
  mockDecide.mockRejectedValueOnce(refused).mockRejectedValue(down);
  expect((await policy.choose(step({ candidates: three }))).fallback).toEqual('failed');
  expect((await policy.choose(step({ candidates: three }))).fallback).toEqual('failed');
  await expect(policy.choose(step({ candidates: three }))).rejects.toThrow('Gateway is down');
  expect(policy.switched().to).toEqual('google/gemini-2.5-flash-lite');
});

test('an ordinary failed jev call does not switch models', async () => {
  const policy = await jevPolicy();
  mockDecide
    .mockRejectedValueOnce(Object.assign(new Error('Timeout'), { statusCode: 504 }))
    .mockResolvedValue(answers({ choice: 'o0' }));
  expect((await policy.choose(step({ candidates: three }))).fallback).toEqual('failed');
  expect(policy.switched()).toBe(null);
});

test('no snapshot text reaches the model; config, menu, message, fixture and typed text do', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-prompt-'));
  try {
    const buildDirectory = path.join(configDirectory, 'build');
    const write = (file, value) => {
      fs.mkdirSync(path.dirname(path.join(configDirectory, file)), { recursive: true });
      fs.writeFileSync(
        path.join(configDirectory, file),
        typeof value === 'string' ? value : JSON.stringify(value)
      );
    };
    write('build/pages/tickets.json', {
      pageId: 'tickets',
      properties: { title: 'Assign ticket' },
    });
    write('build/menus.json', [
      { menuId: 'default', links: [{ properties: { title: 'Support queue' } }] },
    ]);
    write('build/i18n.json', {
      defaultLocale: 'en-US',
      messages: { 'en-US': { open: 'Open tickets' } },
    });
    write(
      'tests/data/staging-sample.yaml',
      'fixtures:\n  tickets:\n    - title: Printer on fire\nusers:\n  member:\n    name: Grace Hopper\n'
    );
    write('.lowdefy/data/staging-sample/manifest.json', { pulledAt: '2026-10-01T00:00:00.000Z' });
    write(
      '.lowdefy/data/staging-sample/tickets.jsonl',
      JSON.stringify({ customer: 'Jane Staging Pty' })
    );
    const dataSet = await parseDataSet({ configDirectory, name: 'staging-sample' });
    const knownText = collectKnownText({
      buildDirectory,
      pageIds: ['tickets'],
      dataSet,
      typed: ['Explorer title 0'],
    });
    const candidates = [
      click('assign', 'Assign ticket'),
      click('queue', 'Support queue'),
      click('open', 'Open tickets'),
      click('grid', 'Jane Staging Pty', {
        target: { blockId: 'grid', row: 1, column: 'customer', text: 'Jane Staging Pty' },
      }),
      click('owner', 'Grace Hopper'),
      click('typed', 'Explorer title 0'),
      {
        kind: 'select',
        target: { blockId: 'customer' },
        blockType: 'Selector',
        blockIds: ['customer'],
        label: 'Customer',
        options: ['Printer on fire', 'Jane Staging Pty'],
      },
    ];
    const progress = createWalkProgress();
    const walkIndex = progress.startWalk();
    const decision = buildDecisionState({
      context: { title: 'Customer column', body: 'Shows the customer.' },
      pageId: 'tickets',
      role: 'member',
      url: '/tickets?customer=Jane%20Staging%20Pty',
      blockDiff: [
        { blockId: 'grid', type: 'AgGrid', change: 'changed', label: 'Jane Staging Pty' },
      ],
      observation: observation(candidates),
      history: ['click AgGrid <data> (grid, row 1, column customer)'],
      knownText,
      progress,
      fixtures: dataSet.fixtures,
    });
    const policy = await createModelPolicy({
      backend: 'structured-output',
      modelId: 'm',
      apiKey: 'k',
      seeded: createSeededPolicy(),
    });
    mockDecide.mockResolvedValue(answers({ choice: 'o0' }));
    await policy.choose({
      ...decision,
      firstStep: false,
      pageId: 'tickets',
      role: 'member',
      walkIndex,
      stepIndex: 1,
    });

    const prompt =
      JSON.stringify(mockDecide.mock.calls[0][0].state) +
      JSON.stringify(mockDecide.mock.calls[0][0].questions);
    expect(prompt).not.toContain('Jane Staging');
    [
      'Assign ticket',
      'Support queue',
      'Open tickets',
      'Printer on fire',
      'Grace Hopper',
      'Explorer title 0',
    ].forEach((text) => expect(prompt).toContain(text));
    expect(prompt).toContain('<data>');
    expect(prompt).toContain('"queryKeys":["customer"]');
  } finally {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  }
});
