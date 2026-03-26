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
  category: 'display',
  icons: [],
  valueType: null,
  events: {
    onMessageComplete: 'Trigger when a message finishes streaming.',
    onToolCall: 'Trigger when a tool is invoked.',
    onToolResult: 'Trigger when a tool completes.',
    onConversationChange: 'Trigger when the user switches conversations.',
    onNewConversation: 'Trigger when the user clicks New Chat.',
    onUserMessage: 'Trigger when the user sends a message.',
    onError: 'Trigger on stream error.',
  },
  properties: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'ID of the agent to chat with.',
      },
    },
    required: ['agentId'],
  },
};
