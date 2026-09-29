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

export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        enum: ['id', 'conversationId'],
        description:
          'Field of the calling agent to return: its id in agents, or the id of the conversation it runs in.',
      },
      {
        type: 'boolean',
        enum: [true],
        description: 'Return the calling agent as { id, conversationId }, or null.',
      },
      {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            enum: ['id', 'conversationId'],
            description: 'Field of the calling agent to return.',
          },
          default: {
            description: 'Value to return when the endpoint was not called by an agent.',
          },
          all: {
            type: 'boolean',
            description: 'Return the calling agent as { id, conversationId }, or null.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
