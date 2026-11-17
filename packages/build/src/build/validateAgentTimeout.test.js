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

import validateAgentTimeout from './validateAgentTimeout.js';
import testContext from '../test-utils/testContext.js';
import { afterEach, expect, test } from 'vitest';

const vercelEnv = process.env.VERCEL;

afterEach(() => {
  if (vercelEnv === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = vercelEnv;
  }
});

// The shapes buildAgents and buildConnections leave behind.
function agentOn({ agentTimeout, connectionTimeout, agentId = 'support' }) {
  return {
    agents: [
      {
        id: `agent:${agentId}`,
        agentId,
        '~k': 'agent_key',
        connectionId: 'gateway',
        properties: { model: 'some-model', timeout: agentTimeout },
      },
    ],
    connections: [
      {
        id: 'connection:gateway',
        connectionId: 'gateway',
        properties: { timeout: connectionTimeout },
      },
    ],
  };
}

function warningsFor({ config, env, agentTimeout, connectionTimeout, agents }) {
  if (env === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = env;
  }
  const context = testContext();
  context.warnings = [];
  validateAgentTimeout({
    components: { config, ...(agents ?? agentOn({ agentTimeout, connectionTimeout })) },
    context,
  });
  return context.warnings;
}

test('validateAgentTimeout warns when neither the agent nor its connection sets a timeout', () => {
  const warnings = warningsFor({ config: { vercel: { maxDuration: 120 } } });
  expect(warnings.map((warning) => warning.message)).toEqual([
    'Agent "support" has no "timeout", and neither has its connection "gateway". On Vercel nothing but the function\'s maxDuration (120 s) stops a chat turn, and a turn Vercel stops ends without an error and without running its onFinish hooks. Set "properties.timeout" (or "timeout.totalMs") on the agent, or "timeout" on the connection, below 120000 ms.',
  ]);
  expect(warnings[0].name).toBe('ConfigWarning');
  expect(warnings[0].configKey).toBe('agent_key');
});

test('validateAgentTimeout warns against the 60 s Vercel default when the build runs on Vercel', () => {
  const warnings = warningsFor({ config: {}, env: '1', agentTimeout: { totalMs: 90000 } });
  expect(warnings.map((warning) => warning.message)).toEqual([
    'Agent "support" timeout (90000 ms) is not shorter than the Vercel function\'s maxDuration (60 s). Vercel stops a chat turn first, so it ends without an error and without running its onFinish hooks. Set the agent\'s timeout below 60000 ms, or raise "config.vercel.maxDuration".',
  ]);
});

test.each([
  ['a number at maxDuration', 120000, undefined],
  ['totalMs above maxDuration', { totalMs: 150000 }, undefined],
  ['no timeout and a connection timeout above maxDuration', undefined, 200000],
])('validateAgentTimeout warns when the agent has %s', (_, agentTimeout, connectionTimeout) => {
  const warnings = warningsFor({
    config: { vercel: { maxDuration: 120 } },
    agentTimeout,
    connectionTimeout,
  });
  expect(warnings).toHaveLength(1);
  expect(warnings[0].message).toContain('is not shorter than the Vercel function');
});

test.each([
  ['a number timeout below maxDuration', { agentTimeout: 100000 }],
  ['totalMs below maxDuration', { agentTimeout: { totalMs: 100000 } }],
  ['no timeout but its connection sets one', { connectionTimeout: 90000 }],
  ['only stepMs, which sets no total', { agentTimeout: { stepMs: 30000 } }],
  ['an operator timeout', { agentTimeout: { _secret: 'AGENT_TIMEOUT' } }],
])('validateAgentTimeout does not warn when the agent has %s', (_, timeouts) => {
  expect(warningsFor({ config: { vercel: { maxDuration: 120 } }, ...timeouts })).toEqual([]);
});

test('validateAgentTimeout does not warn when the app does not target Vercel', () => {
  expect(warningsFor({ config: {} })).toEqual([]);
});

test('validateAgentTimeout skips agents buildAgents rejected', () => {
  const agents = agentOn({});
  delete agents.agents[0].agentId;
  expect(warningsFor({ config: { vercel: { maxDuration: 120 } }, agents })).toEqual([]);
});

test('validateAgentTimeout does not warn for an app with no agents', () => {
  expect(warningsFor({ config: { vercel: {} }, agents: {} })).toEqual([]);
});
