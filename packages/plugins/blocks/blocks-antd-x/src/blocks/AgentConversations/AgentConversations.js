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

import React from 'react';
import { Conversations } from '@ant-design/x';
import { Button } from 'antd';

function AgentConversations({ blockId, methods, properties }) {
  const { items, activeKey, menu, creation, groupable, width } = properties;

  function handleNew() {
    methods.triggerEvent({ name: 'onNew', event: {} });
  }

  const menuConfig = menu
    ? (conversation) => ({
        items: menu,
        onClick: ({ key }) => {
          methods.triggerEvent({
            name: 'onMenuClick',
            event: { action: key, conversationKey: conversation.key, conversation },
          });
        },
      })
    : undefined;

  const creationConfig = creation
    ? {
        label: creation.label ?? 'New Chat',
        icon: creation.icon,
        align: creation.align ?? 'start',
        onClick: handleNew,
      }
    : undefined;

  const groupableConfig = groupable
    ? {
        collapsible: groupable.collapsible ?? true,
        label: groupable.label,
        ...(groupable.defaultExpandedKeys
          ? { defaultExpandedKeys: groupable.defaultExpandedKeys }
          : {}),
      }
    : undefined;

  return (
    <div
      id={blockId}
      style={{ width: width ?? 250, borderRight: '1px solid #f0f0f0', overflow: 'auto' }}
    >
      {!creationConfig && (
        <div style={{ padding: '12px 16px' }}>
          <Button block onClick={handleNew}>
            + New Chat
          </Button>
        </div>
      )}
      <Conversations
        items={items ?? []}
        activeKey={activeKey}
        onActiveChange={(key) => {
          methods.triggerEvent({
            name: 'onSelect',
            event: { key, previousKey: activeKey },
          });
        }}
        menu={menuConfig}
        creation={creationConfig}
        groupable={groupableConfig}
      />
    </div>
  );
}

AgentConversations.meta = {
  category: 'agent',
  icons: [],
  styles: ['blocks/AgentConversations/style.less'],
};

export default AgentConversations;
