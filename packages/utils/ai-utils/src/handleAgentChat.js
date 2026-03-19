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

import { streamText, tool, jsonSchema, convertToModelMessages } from 'ai';

async function handleAgentChat({ connection, properties, context }) {
  const { agent, messages } = properties;
  const modelMessages = await convertToModelMessages(messages);

  const tools = {};
  for (const endpointId of agent.tools ?? []) {
    const endpointConfig = await context.getEndpointConfig({ endpointId });
    tools[endpointId] = tool({
      description: endpointConfig.description,
      parameters: jsonSchema(endpointConfig.payloadSchema),
      execute: async (input) => {
        const result = await context.callEndpoint(endpointId, { payload: input });
        if (!result.success) {
          throw new Error(result.error?.message ?? 'Endpoint execution failed');
        }
        return result.response;
      },
    });
  }

  const model = connection.provider(agent.properties.model);

  const result = streamText({
    model,
    system: agent.properties.instructions,
    messages: modelMessages,
    tools,
    maxSteps: agent.properties.maxSteps ?? 10,
    maxOutputTokens: agent.properties.maxOutputTokens,
    temperature: agent.properties.temperature,
    toolChoice: agent.properties.toolChoice ?? 'auto',
  });

  return result;
}

export default handleAgentChat;
