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

import { ConfigWarning } from '@lowdefy/errors';
import { getOperatorType, type } from '@lowdefy/helpers';

// The function maxDuration `lowdefy vercel-output` writes when config.vercel.maxDuration is not set.
const DEFAULT_VERCEL_MAX_DURATION_S = 60;

// config.requestTimeout never applies to an agent chat, and on Vercel a turn runs on after its
// client disconnects, so an agent without its own timeout runs until Vercel stops the function at
// maxDuration. A function killed that way ends the stream with no error and never runs the
// agent's onFinish hooks, which save the conversation; the agent's own timeout cancels the calls,
// reports the error and still runs them. The app targets Vercel when it sets config.vercel, or
// when the build runs on Vercel (Vercel sets VERCEL in its build environment).
function validateAgentTimeout({ components, context }) {
  const { vercel } = components.config;
  const targetsVercel = !type.isNone(vercel) || !type.isNone(process.env.VERCEL);
  if (!targetsVercel) {
    return components;
  }
  const maxDuration = vercel?.maxDuration ?? DEFAULT_VERCEL_MAX_DURATION_S;
  // testSchema has already warned about a maxDuration of the wrong type.
  if (!type.isNumber(maxDuration)) {
    return components;
  }
  (components.agents ?? []).forEach((agent) => {
    // buildAgents sets agentId on the agents that passed its checks; it reported the rest.
    if (type.isNone(agent?.agentId)) return;
    const connection = (components.connections ?? []).find(
      (item) => item.connectionId === agent.connectionId
    );
    const timeout = agent.properties?.timeout ?? connection?.properties?.timeout;
    // An operator is evaluated per request, so its value is only known at runtime.
    if (getOperatorType(timeout) !== null) return;
    const configKey = agent['~k'];
    if (type.isNone(timeout)) {
      context.handleWarning(
        new ConfigWarning(
          `Agent "${agent.agentId}" has no "timeout", and neither has its connection "${
            agent.connectionId
          }". On Vercel nothing but the function's maxDuration (${maxDuration} s) stops a chat turn, and a turn Vercel stops ends without an error and without running its onFinish hooks. Set "properties.timeout" (or "timeout.totalMs") on the agent, or "timeout" on the connection, below ${
            maxDuration * 1000
          } ms.`,
          { configKey }
        )
      );
      return;
    }
    const totalMs = type.isObject(timeout) ? timeout.totalMs : timeout;
    // An object with only stepMs or chunkMs sets no total to compare.
    if (!type.isNumber(totalMs) || totalMs < maxDuration * 1000) return;
    context.handleWarning(
      new ConfigWarning(
        `Agent "${
          agent.agentId
        }" timeout (${totalMs} ms) is not shorter than the Vercel function's maxDuration (${maxDuration} s). Vercel stops a chat turn first, so it ends without an error and without running its onFinish hooks. Set the agent's timeout below ${
          maxDuration * 1000
        } ms, or raise "config.vercel.maxDuration".`,
        { configKey }
      )
    );
  });
  return components;
}

export default validateAgentTimeout;
