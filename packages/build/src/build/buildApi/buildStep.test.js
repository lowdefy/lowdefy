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

import buildApi from './buildApi.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('step does not have an id', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_missing_step_id',
        type: 'Api',
        routine: [
          {
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step id missing at endpoint "test_missing_step_id".'
  );
});

test('step id is not a string', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_id_not_string',
        type: 'Api',
        routine: [
          {
            id: true,
            type: 'MongoDBUpdateOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step id is not a string at endpoint "test_step_id_not_string".'
  );
});

test('step type not a string', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_type_not_string',
        type: 'Api',
        routine: [
          {
            id: 'stepId',
            type: 1,
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step type is not a string at "stepId" on endpoint "test_step_type_not_string".'
  );
});

// Removed for now because step might be used in mutually exclusive branches of a routine (if or switch)

// test('throw on duplicate step ids', () => {
//   const context = testContext({ logger });
//   const components = {
//     api: [
//       {
//         id: 'test_duplicate_step_ids',
//         type: 'Api',
//         routine: [
//           {
//             id: 'step_1',
//             type: 'MongoDBInsertOne',
//             connectionId: 'connection',
//           },
//           {
//             id: 'step_1',
//             type: 'MongoDBInsertOne',
//             connectionId: 'connection',
//           },
//         ],
//       },
//     ],
//   };
//   expect(() => buildApi({ components, context })).toThrow(
//     'Duplicate stepId "step_1" on endpoint "test_duplicate_step_ids"'
//   );
// });

test('no connectionId on step', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_no_connectionId',
        type: 'Api',
        routine: [{ id: 'step_id', type: 'MongoDBUpdateOne' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step connectionId missing at endpoint "test_no_connectionId".'
  );
});

test('connectionId is not a string', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_no_connectionId',
        type: 'Api',
        routine: [{ id: 'step_id', type: 'MongoDBUpdateOne', connectionId: false }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step connectionId is not a string at endpoint "test_no_connectionId".'
  );
});
test('request step tenant none is accepted', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_tenant_none',
        type: 'Api',
        routine: [
          {
            id: 'step_id',
            type: 'MongoDBUpdateOne',
            connectionId: 'connection',
            tenant: 'none',
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0].tenant).toBe('none');
});

test('request step tenant authored is accepted', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_tenant_authored',
        type: 'Api',
        routine: [
          {
            id: 'step_id',
            type: 'MongoDBAggregation',
            connectionId: 'connection',
            tenant: 'authored',
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0].tenant).toBe('authored');
});

test('request step tenant true throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_tenant_true',
        type: 'Api',
        routine: [
          {
            id: 'step_id',
            type: 'MongoDBUpdateOne',
            connectionId: 'connection',
            tenant: true,
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step "step_id" at endpoint "test_step_tenant_true" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.'
  );
});

test('request step tenant with another string throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_tenant_string',
        type: 'Api',
        routine: [
          {
            id: 'step_id',
            type: 'MongoDBUpdateOne',
            connectionId: 'connection',
            tenant: 'off',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step "step_id" at endpoint "test_step_tenant_string" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.'
  );
});

test('a literal $search step pipeline on a walled connection without tenant authored throws at build', () => {
  const context = testContext({ logger });
  context.tenantConnections.set('walled', { type: 'MongoDBCollection', field: 'organization_id' });
  const components = {
    api: [
      {
        id: 'test_step_search_unauthored',
        type: 'Api',
        routine: [
          {
            id: 'step_id',
            type: 'MongoDBAggregation',
            connectionId: 'walled',
            properties: { pipeline: [{ $search: { text: { query: 'q', path: 'name' } } }] },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step "step_id" at endpoint "test_step_search_unauthored" contains "$search" in its pipeline on tenant connection "walled", which the tenant wall does not scope mechanically.'
  );
});

test('a literal $graphLookup step on a walled connection with tenant authored passes the build check', () => {
  const context = testContext({ logger });
  context.tenantConnections.set('walled', { type: 'MongoDBCollection', field: 'organization_id' });
  const components = {
    api: [
      {
        id: 'test_step_graphlookup_authored',
        type: 'Api',
        routine: [
          {
            id: 'step_id',
            type: 'MongoDBAggregation',
            connectionId: 'walled',
            tenant: 'authored',
            properties: { pipeline: [{ $graphLookup: { from: 'walled' } }] },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0].tenant).toBe('authored');
});

test('valid routine step config nested array', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_valid_routine_steps_nested',
        type: 'Api',
        routine: [
          [
            {
              id: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            { id: 'step_2', type: 'MongoDBUpdateOne', connectionId: 'connection' },
            [{ id: 'step_3', type: 'MongoDBAggregation', connectionId: 'connection' }],
          ],
          [[[{ id: 'step_4', type: 'MongoDBInsertMany', connectionId: 'connection' }]]],
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_valid_routine_steps_nested',
        endpointId: 'test_valid_routine_steps_nested',
        type: 'Api',
        routine: [
          [
            {
              id: 'request:test_valid_routine_steps_nested:step_1',
              endpointId: 'test_valid_routine_steps_nested',
              stepId: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            {
              id: 'request:test_valid_routine_steps_nested:step_2',
              endpointId: 'test_valid_routine_steps_nested',
              stepId: 'step_2',
              type: 'MongoDBUpdateOne',
              connectionId: 'connection',
            },
            [
              {
                id: 'request:test_valid_routine_steps_nested:step_3',
                endpointId: 'test_valid_routine_steps_nested',
                stepId: 'step_3',
                type: 'MongoDBAggregation',
                connectionId: 'connection',
              },
            ],
          ],
          [
            [
              [
                {
                  id: 'request:test_valid_routine_steps_nested:step_4',
                  endpointId: 'test_valid_routine_steps_nested',
                  stepId: 'step_4',
                  type: 'MongoDBInsertMany',
                  connectionId: 'connection',
                },
              ],
            ],
          ],
        ],
      },
    ],
  });
});

test('CallApi step builds with endpoint prefix', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_step',
        type: 'Api',
        routine: [
          {
            id: 'call_other',
            type: 'CallApi',
            properties: {
              endpointId: 'other_endpoint',
              payload: { key: 'value' },
            },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_callapi_step',
        endpointId: 'test_callapi_step',
        type: 'Api',
        routine: [
          {
            id: 'endpoint:test_callapi_step:call_other',
            endpointId: 'test_callapi_step',
            stepId: 'call_other',
            type: 'CallApi',
            properties: {
              endpointId: 'other_endpoint',
              payload: { key: 'value' },
            },
          },
        ],
      },
    ],
  });
});

test('CallApi step without properties.endpointId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_no_endpoint',
        type: 'Api',
        routine: [
          {
            id: 'call_other',
            type: 'CallApi',
            properties: {},
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint step "call_other" at endpoint "test_callapi_no_endpoint" requires properties.endpointId.'
  );
});

test('CallApi step with connectionId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_with_connection',
        type: 'Api',
        routine: [
          {
            id: 'call_other',
            type: 'CallApi',
            connectionId: 'test_connection',
            properties: {
              endpointId: 'other_endpoint',
            },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint step "call_other" at endpoint "test_callapi_with_connection" should not have a connectionId.'
  );
});

test('CallApi step is not counted in typeCounters.requests', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_no_count',
        type: 'Api',
        routine: [
          {
            id: 'db_step',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
          {
            id: 'call_other',
            type: 'CallApi',
            properties: {
              endpointId: 'other_endpoint',
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 1,
  });
});

test('ValidateSchema step builds with validate prefix', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_validate_step',
        type: 'Api',
        routine: [
          {
            id: 'check_input',
            type: 'ValidateSchema',
            properties: {
              schema: { type: 'object', required: ['name'] },
              data: { _payload: true },
            },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0]).toEqual({
    id: 'validate:test_validate_step:check_input',
    endpointId: 'test_validate_step',
    stepId: 'check_input',
    type: 'ValidateSchema',
    properties: {
      schema: { type: 'object', required: ['name'] },
      data: { _payload: true },
    },
  });
});

test('ValidateSchema step without properties.schema throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_validate_no_schema',
        type: 'Api',
        routine: [
          {
            id: 'check_input',
            type: 'ValidateSchema',
            properties: { data: { _payload: true } },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'ValidateSchema step "check_input" at endpoint "test_validate_no_schema" requires properties.schema.'
  );
});

test('ValidateSchema step without properties.data throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_validate_no_data',
        type: 'Api',
        routine: [
          {
            id: 'check_input',
            type: 'ValidateSchema',
            properties: { schema: { type: 'object' } },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'ValidateSchema step "check_input" at endpoint "test_validate_no_data" requires properties.data.'
  );
});

test('ValidateSchema step with connectionId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_validate_with_connection',
        type: 'Api',
        routine: [
          {
            id: 'check_input',
            type: 'ValidateSchema',
            connectionId: 'unused',
            properties: {
              schema: { type: 'object' },
              data: {},
            },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'ValidateSchema step "check_input" at endpoint "test_validate_with_connection" should not have a connectionId.'
  );
});

test('ValidateSchema step is not counted in typeCounters.requests', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_validate_no_count',
        type: 'Api',
        routine: [
          {
            id: 'db_step',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
          {
            id: 'check_input',
            type: 'ValidateSchema',
            properties: {
              schema: { type: 'object' },
              data: {},
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 1,
  });
});

test('mixed request and CallApi steps in routine', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_mixed_steps',
        type: 'Api',
        routine: [
          {
            id: 'db_query',
            type: 'MongoDBFind',
            connectionId: 'connection',
          },
          {
            id: 'call_processor',
            type: 'CallApi',
            properties: {
              endpointId: 'processor_endpoint',
              payload: { data: { _step: 'db_query' } },
            },
          },
          {
            id: 'db_insert',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0].id).toBe('request:test_mixed_steps:db_query');
  expect(res.api[0].routine[1].id).toBe('endpoint:test_mixed_steps:call_processor');
  expect(res.api[0].routine[2].id).toBe('request:test_mixed_steps:db_insert');
});

test('count steps', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_count_steps',
        type: 'Api',
        routine: [
          [
            {
              id: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            { id: 'step_2', type: 'MongoDBUpdateOne', connectionId: 'connection' },
            [{ id: 'step_3', type: 'MongoDBAggregation', connectionId: 'connection' }],
          ],
          { id: 'step_4', type: 'MongoDBInsertOne', connectionId: 'connection' },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 2,
    MongoDBUpdateOne: 1,
    MongoDBAggregation: 1,
  });
});

test('CallAgent step builds with agent prefix', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callagent_step',
        type: 'Api',
        routine: [
          {
            id: 'run_agent',
            type: 'CallAgent',
            properties: {
              agentId: 'research_agent',
              prompt: 'Summarize the signups.',
            },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_callagent_step',
        endpointId: 'test_callagent_step',
        type: 'Api',
        routine: [
          {
            id: 'agent:test_callagent_step:run_agent',
            endpointId: 'test_callagent_step',
            stepId: 'run_agent',
            type: 'CallAgent',
            properties: {
              agentId: 'research_agent',
              prompt: 'Summarize the signups.',
            },
          },
        ],
      },
    ],
  });
});

test('CallAgent step allows operator objects for agentId and prompt', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callagent_operators',
        type: 'Api',
        routine: [
          {
            id: 'run_agent',
            type: 'CallAgent',
            properties: {
              agentId: { _payload: 'agent' },
              prompt: { _payload: 'instruction' },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).not.toThrow();
});

test('CallAgent step without properties.agentId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callagent_no_agent',
        type: 'Api',
        routine: [
          {
            id: 'run_agent',
            type: 'CallAgent',
            properties: { prompt: 'Go.' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'CallAgent step "run_agent" at endpoint "test_callagent_no_agent" requires properties.agentId.'
  );
});

test('CallAgent step without properties.prompt throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callagent_no_prompt',
        type: 'Api',
        routine: [
          {
            id: 'run_agent',
            type: 'CallAgent',
            properties: { agentId: 'research_agent' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'CallAgent step "run_agent" at endpoint "test_callagent_no_prompt" requires properties.prompt.'
  );
});

test('CallAgent step with connectionId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callagent_with_connection',
        type: 'Api',
        routine: [
          {
            id: 'run_agent',
            type: 'CallAgent',
            connectionId: 'test_connection',
            properties: { agentId: 'research_agent', prompt: 'Go.' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'CallAgent step "run_agent" at endpoint "test_callagent_with_connection" should not have a connectionId.'
  );
});

test('CallAgent step is not counted in typeCounters.requests', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callagent_no_count',
        type: 'Api',
        routine: [
          {
            id: 'db_step',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
          {
            id: 'run_agent',
            type: 'CallAgent',
            properties: { agentId: 'research_agent', prompt: 'Go.' },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 1,
  });
});

test('Auth step builds with auth prefix', () => {
  const context = testContext({ logger });
  context.typesMap = { steps: { BanUser: { package: '@lowdefy/plugin-better-auth' } } };
  const components = {
    api: [
      {
        id: 'test_auth_step',
        type: 'Api',
        routine: [
          {
            id: 'ban_user',
            type: 'BanUser',
            properties: { userId: 'user_1' },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_auth_step',
        endpointId: 'test_auth_step',
        type: 'Api',
        routine: [
          {
            id: 'auth:test_auth_step:ban_user',
            endpointId: 'test_auth_step',
            stepId: 'ban_user',
            type: 'BanUser',
            properties: { userId: 'user_1' },
          },
        ],
      },
    ],
  });
});

test('Auth step with connectionId throws', () => {
  const context = testContext({ logger });
  context.typesMap = { steps: { BanUser: { package: '@lowdefy/plugin-better-auth' } } };
  const components = {
    api: [
      {
        id: 'test_auth_step_connection',
        type: 'Api',
        routine: [{ id: 'ban_user', type: 'BanUser', connectionId: 'test_connection' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Auth step "ban_user" at endpoint "test_auth_step_connection" should not have a connectionId.'
  );
});

test('Auth step with non-object properties throws', () => {
  const context = testContext({ logger });
  context.typesMap = { steps: { BanUser: { package: '@lowdefy/plugin-better-auth' } } };
  const components = {
    api: [
      {
        id: 'test_auth_step_properties',
        type: 'Api',
        routine: [{ id: 'ban_user', type: 'BanUser', properties: 'not-an-object' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Auth step "ban_user" at endpoint "test_auth_step_properties" properties is not an object.'
  );
});

test('Auth step with non-boolean system throws', () => {
  const context = testContext({ logger });
  context.typesMap = { steps: { BanUser: { package: '@lowdefy/plugin-better-auth' } } };
  const components = {
    api: [
      {
        id: 'test_auth_step_system',
        type: 'Api',
        routine: [{ id: 'ban_user', type: 'BanUser', system: 'yes' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Auth step "ban_user" at endpoint "test_auth_step_system" system must be a boolean.'
  );
});

test('Auth step with boolean system does not throw', () => {
  const context = testContext({ logger });
  context.typesMap = { steps: { BanUser: { package: '@lowdefy/plugin-better-auth' } } };
  const components = {
    api: [
      {
        id: 'test_auth_step_system_valid',
        type: 'Api',
        routine: [{ id: 'ban_user', type: 'BanUser', system: true }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).not.toThrow();
});

test('Auth step is counted in typeCounters.steps and not typeCounters.requests', () => {
  const context = testContext({ logger });
  context.typesMap = { steps: { BanUser: { package: '@lowdefy/plugin-better-auth' } } };
  const components = {
    api: [
      {
        id: 'test_auth_step_count',
        type: 'Api',
        routine: [
          { id: 'db_step', type: 'MongoDBInsertOne', connectionId: 'connection' },
          { id: 'ban_user', type: 'BanUser', properties: { userId: 'user_1' } },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 1,
  });
  expect(context.typeCounters.steps.getCounts()).toEqual({
    BanUser: 1,
  });
});

test('RenderNotification step builds with notification prefix', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_step',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: {
              notificationId: 'task-assigned',
              data: { _step: 'get_data' },
            },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_rendernotification_step',
        endpointId: 'test_rendernotification_step',
        type: 'Api',
        routine: [
          {
            id: 'notification:test_rendernotification_step:render',
            endpointId: 'test_rendernotification_step',
            stepId: 'render',
            type: 'RenderNotification',
            properties: {
              notificationId: 'task-assigned',
              data: { _step: 'get_data' },
            },
          },
        ],
      },
    ],
  });
});

test('RenderNotification step allows operator objects for notificationId and data', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_operators',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: {
              notificationId: { _payload: 'notificationId' },
              data: { _payload: 'item' },
            },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).not.toThrow();
});

test('RenderNotification step without properties.notificationId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_no_id',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: { data: {} },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'RenderNotification step "render" at endpoint "test_rendernotification_no_id" requires properties.notificationId.'
  );
});

test('RenderNotification step without properties.data throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_no_data',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: { notificationId: 'task-assigned' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'RenderNotification step "render" at endpoint "test_rendernotification_no_data" requires properties.data.'
  );
});

test('RenderNotification step with string data throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_bad_data',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: { notificationId: 'task-assigned', data: 'data' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'RenderNotification step "render" at endpoint "test_rendernotification_bad_data" properties.data is not an object.'
  );
});

test('RenderNotification step with array data throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_array_data',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: {
              notificationId: 'task-assigned',
              data: [{ contact: { _id: 'UC-1' } }],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'RenderNotification step "render" at endpoint "test_rendernotification_array_data" properties.data is not an object.'
  );
});

test('RenderNotification step with connectionId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_with_connection',
        type: 'Api',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            connectionId: 'test_connection',
            properties: { notificationId: 'task-assigned', data: {} },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'RenderNotification step "render" at endpoint "test_rendernotification_with_connection" should not have a connectionId.'
  );
});

test('RenderNotification step is not counted in typeCounters.requests', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_rendernotification_no_count',
        type: 'Api',
        routine: [
          {
            id: 'db_step',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
          {
            id: 'render',
            type: 'RenderNotification',
            properties: { notificationId: 'task-assigned', data: {} },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 1,
  });
});
