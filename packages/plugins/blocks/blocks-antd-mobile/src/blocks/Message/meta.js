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
  cssKeys: {},
  methods: {
    open: 'Show the message as a Toast. Args: { content, duration, status }.',
  },
  events: {
    onClose: 'Trigger actions when the message closes.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      content: {
        type: 'string',
        description: 'Message content - supports html.',
      },
      duration: {
        type: 'number',
        description: 'Seconds the message is shown for.',
        default: 2,
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning', 'loading'],
        default: 'success',
        description: 'Message status - controls the Toast icon.',
      },
    },
  },
};
