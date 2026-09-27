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
import { UserError } from '@lowdefy/errors';
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import resolveDynamicContent from '../page/dynamic/resolveDynamicContent.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const policy = {
  id: 'form',
  blocks: ['Box', 'TextInput'],
  actions: ['SetState'],
  operators: ['_state'],
  endpoints: [],
  requests: [],
  links: { pages: [], origins: [] },
  state: 'form',
  html: false,
  limits: { depth: 10, blocks: 500, bytes: 262144, actionsPerEvent: 20 },
};

const types = {
  actions: { SetState: {}, Logout: {} },
  blocks: { Box: {}, Dynamic: {}, TextInput: {}, Html: {} },
  operators: { client: { _state: {}, _global: {} }, server: {} },
};

function createFiles(extra = {}) {
  return {
    'types.json': types,
    'plugins/blockMetas.json': { TextInput: { valueType: 'string' } },
    'plugins/blockSchemas.json': {},
    'dynamicPolicies.json': { form: policy },
    ...extra,
  };
}

function createTestContext(files) {
  const context = testContext({
    operators: operatorsServer,
    logger,
    readConfigFile: jest.fn((path) => files[path] ?? null),
    session: { user: { id: 'user_1' } },
  });
  context.endpointId = 'generate';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function createRoutineContext() {
  return { steps: {}, payload: {}, arrayIndices: [], items: {}, endpointDepth: 0 };
}

// Content is read from the payload, as a model or database step's result would
// be: step properties evaluate operators, results do not.
function validateStep(blocks, { throwOnInvalid = false } = {}) {
  return {
    id: 'validateDynamic:generate:check',
    stepId: 'check',
    endpointId: 'generate',
    type: 'ValidateDynamic',
    properties: { policy: 'form', blocks: { _payload: 'content' }, throwOnInvalid },
    content: blocks,
  };
}

function runStep(context, routineContext, step) {
  const { content, ...routine } = step;
  routineContext.payload = { content };
  return runRoutine(context, routineContext, { routine });
}

const validContent = [
  {
    id: 'form.name',
    type: 'TextInput',
    visible: { _state: 'form.show' },
    events: { onChange: [{ id: 'set', type: 'SetState', params: { 'form.touched': true } }] },
  },
];

const invalidContent = [
  {
    id: 'box',
    type: 'Box',
    events: { onMount: [{ id: 'out', type: 'Logout' }] },
    blocks: [{ id: 'status', type: 'TextInput', properties: { title: { _global: 'x' } } }],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

test('ValidateDynamic records valid content as valid', async () => {
  const context = createTestContext(createFiles());
  const routineContext = createRoutineContext();
  const res = await runStep(context, routineContext, validateStep(validContent));
  expect(res.status).toBe('continue');
  expect(routineContext.steps.check).toEqual({ valid: true, errors: [], blocks: validContent });
});

test('ValidateDynamic records every violation with its path and rule', async () => {
  const context = createTestContext(createFiles());
  const routineContext = createRoutineContext();
  await runStep(context, routineContext, validateStep(invalidContent));
  expect(routineContext.steps.check.valid).toBe(false);
  expect(routineContext.steps.check.errors.map(({ path, rule }) => `${rule} ${path}`)).toEqual([
    'policy.actions blocks.0.events.onMount.0.type',
    'policy.state blocks.0.blocks.0.id',
    'policy.operators blocks.0.blocks.0.properties.title',
  ]);
});

test('ValidateDynamic throws a UserError by default when content is invalid', async () => {
  const context = createTestContext(createFiles());
  const res = await runStep(
    context,
    createRoutineContext(),
    validateStep(invalidContent, { throwOnInvalid: true })
  );
  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(UserError);
  expect(res.error.message).toContain('ValidateDynamic step "check" failed');
});

test('ValidateDynamic leaves the checked content unchanged', async () => {
  const context = createTestContext(createFiles());
  const content = JSON.parse(JSON.stringify(validContent));
  await runStep(context, createRoutineContext(), validateStep(content));
  expect(content).toEqual(validContent);
});

test('ValidateDynamic reports content that is not an array', async () => {
  const context = createTestContext(createFiles());
  const routineContext = createRoutineContext();
  await runStep(context, routineContext, validateStep({ id: 'x' }));
  expect(routineContext.steps.check.errors[0].rule).toBe('shape');
});

test('DescribeDynamicPolicy returns the policy with each allowed block schema', async () => {
  const schema = { type: 'object', properties: { title: { type: 'string' } } };
  const context = createTestContext(
    createFiles({
      'plugins/actionSchemas.json': { SetState: { type: 'object' } },
      'plugins/blockSchemas.json': { TextInput: { properties: { properties: schema } } },
    })
  );
  const routineContext = createRoutineContext();
  await runRoutine(context, routineContext, {
    routine: {
      id: 'describeDynamic:generate:vocab',
      stepId: 'vocab',
      type: 'DescribeDynamicPolicy',
      properties: { policy: 'form' },
    },
  });
  expect(routineContext.steps.vocab.blocks).toEqual({ Box: null, TextInput: schema });
  expect(routineContext.steps.vocab.state).toBe('form');
  expect(routineContext.steps.vocab.actions).toEqual({ SetState: { type: 'object' } });
  expect(routineContext.steps.vocab.operators).toEqual({ _state: null });
});

// Page get must agree with the step: the same content passes or fails both.
test.each([
  ['valid', validContent, true],
  ['invalid', invalidContent, false],
])('ValidateDynamic and page get agree on %s content', async (_, content, expected) => {
  const stepContext = createTestContext(createFiles());
  const routineContext = createRoutineContext();
  await runStep(stepContext, routineContext, validateStep(content));

  const pageContext = createTestContext(
    createFiles({
      'api/get_form.json': {
        endpointId: 'get_form',
        type: 'InternalApi',
        auth: { public: true },
        // Stored content arrives as data, as a database step's result would,
        // and becomes config only through a passing ValidateDynamic step.
        routine: [
          {
            id: 'validateDynamic:get_form:check',
            stepId: 'check',
            endpointId: 'get_form',
            type: 'ValidateDynamic',
            properties: { policy: 'form', blocks: { _payload: 'params.content' } },
          },
          { ':return': { blocks: { _step: 'check.blocks' } } },
        ],
      },
    })
  );
  const dynamicBlock = {
    id: 'block:page1:generated:0',
    blockId: 'generated',
    type: 'Dynamic',
    properties: { endpointId: 'get_form', params: { content }, policy: 'form' },
    slots: { fallback: { blocks: [{ id: 'fb', blockId: 'fb', type: 'Html' }] } },
  };
  await resolveDynamicContent(pageContext, {
    pageConfig: {
      id: 'page:page1',
      pageId: 'page1',
      blockId: 'page1',
      type: 'Box',
      dynamic: true,
      requests: [],
      slots: { content: { blocks: [dynamicBlock] } },
    },
    urlQuery: {},
  });
  const rendered = dynamicBlock.slots.content.blocks[0].blockId !== 'fb';

  expect(routineContext.steps.check.valid).toBe(expected);
  expect(rendered).toBe(expected);
  if (expected) {
    // Policy-bound content is config: its operators reach the client.
    expect(dynamicBlock.slots.content.blocks[0].visible).toEqual({ _state: 'form.show' });
    expect(dynamicBlock.properties.policy).toBe(undefined);
  }
});

test('A policy-bound Dynamic block keeps endpoint data literal without a ValidateDynamic step', async () => {
  const context = createTestContext(
    createFiles({
      'api/get_form.json': {
        endpointId: 'get_form',
        type: 'InternalApi',
        auth: { public: true },
        routine: { ':return': { blocks: { _payload: 'params.content' } } },
      },
    })
  );
  const dynamicBlock = {
    id: 'block:page1:generated:0',
    blockId: 'generated',
    type: 'Dynamic',
    properties: { endpointId: 'get_form', params: { content: validContent }, policy: 'form' },
    slots: { fallback: { blocks: [{ id: 'fb', blockId: 'fb', type: 'Html' }] } },
  };
  await resolveDynamicContent(context, {
    pageConfig: {
      id: 'page:page1',
      pageId: 'page1',
      blockId: 'page1',
      type: 'Box',
      dynamic: true,
      requests: [],
      slots: { content: { blocks: [dynamicBlock] } },
    },
    urlQuery: {},
  });
  expect(dynamicBlock.slots.content.blocks[0].blockId).toBe('fb');
});
