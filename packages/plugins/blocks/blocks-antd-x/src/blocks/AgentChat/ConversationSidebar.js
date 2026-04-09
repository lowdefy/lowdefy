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

function ConversationSidebar({
  items,
  activeKey,
  onConversationChange,
  onNewConversation,
  onMenuClick,
  menu,
  creation,
}) {
  const menuConfig = menu
    ? (conversation) => ({
        items: menu,
        onClick: ({ key }) =>
          onMenuClick?.({ action: key, conversationKey: conversation.key, conversation }),
      })
    : undefined;

  const creationConfig = creation
    ? {
        label: creation.label ?? 'New Chat',
        icon: creation.icon,
        align: creation.align ?? 'start',
        onClick: onNewConversation,
      }
    : undefined;

  return (
    <div style={{ width: 250, borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
      {!creationConfig && (
        <div style={{ padding: '12px 16px' }}>
          <Button block onClick={onNewConversation}>
            + New Chat
          </Button>
        </div>
      )}
      <Conversations
        items={items ?? []}
        activeKey={activeKey}
        onActiveChange={(key) => {
          onConversationChange(key, activeKey);
        }}
        menu={menuConfig}
        creation={creationConfig}
      />
    </div>
  );
}

export default ConversationSidebar;
