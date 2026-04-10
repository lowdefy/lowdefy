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
  category: 'agent',
  icons: [],
  valueType: null,
  events: {
    onSelect: 'Trigger when the user clicks a conversation.',
    onNew: 'Trigger when the user clicks New Chat.',
    onMenuClick: 'Trigger when the user clicks a conversation context menu item.',
  },
  properties: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'Conversation list. Each item: { key, label, icon?, disabled?, timestamp?, group? }.',
      },
      activeKey: {
        type: 'string',
        description: 'Currently selected conversation key.',
      },
    },
  },
};
