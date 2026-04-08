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
    onFeedback: 'Trigger when the user clicks thumbs up or down on a message.',
    onBeforeSend: 'Trigger before a message is sent. Return success: false to cancel.',
    onStop: 'Trigger when the user stops generation.',
  },
  methods: {
    regenerate: 'Regenerate the last assistant message. Accepts optional args.messageId to regenerate a specific message.',
    setMessages: 'Replace the message list. Accepts args.messages array.',
    sendMessage: 'Send a message programmatically. Accepts args.text string.',
    clearMessages: 'Clear all messages from the chat.',
    deleteMessage: 'Delete a specific message. Accepts args.messageId string.',
    stop: 'Stop the current streaming response.',
    clearError: 'Clear the current error state.',
    scrollToBottom: 'Scroll the message list to the bottom.',
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
