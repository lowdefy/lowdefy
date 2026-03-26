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
import { Bubble } from '@ant-design/x';

import MessageBubble from './MessageBubble.js';

function MessageList({ messages, isStreaming, config, addToolApprovalResponse, onFeedback }) {
  // Build a lookup map for assistant message parts.
  // Bubble.List's contentRender callback only receives (content, info) where info.key is the
  // item key — it does not receive the full message object with its parts array. This map
  // bridges that gap so MessageBubble can render tool calls, reasoning, etc.
  const partsMap = new Map(
    messages.filter((msg) => msg.role === 'assistant').map((msg) => [msg.id, msg.parts])
  );

  const lastMessage = messages[messages.length - 1];
  const items = messages.map((msg) => {
    const isLastAssistant = msg === lastMessage && msg.role === 'assistant';
    const textContent =
      msg.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('') ?? '';
    return {
      key: msg.id,
      content: textContent,
      role: msg.role === 'user' ? 'user' : 'ai',
      // Only show loading dots when streaming has started but no content has arrived yet.
      // Once the first token or tool part appears, loading flips to false and content renders.
      loading:
        isStreaming &&
        isLastAssistant &&
        textContent.length === 0 &&
        !msg.parts?.some((part) => part.type !== 'text' && part.type !== 'step-start'),
    };
  });

  // When busy but no assistant message exists yet (submitted, waiting for first chunk),
  // append a placeholder so loading dots are visible immediately.
  if (isStreaming && lastMessage?.role !== 'assistant') {
    items.push({ key: '__loading', content: '', role: 'ai', loading: true });
  }

  return (
    <Bubble.List
      items={items}
      role={{
        user: {
          placement: 'end',
          variant: 'filled',
          shape: 'round',
          ...(config?.roles?.user?.avatar != null && {
            avatar: { src: config.roles.user.avatar },
          }),
          ...(config?.roles?.user?.name != null && { header: config.roles.user.name }),
        },
        ai: {
          placement: 'start',
          variant: 'outlined',
          ...(config?.roles?.assistant?.avatar != null && {
            avatar: { src: config.roles.assistant.avatar },
          }),
          ...(config?.roles?.assistant?.name != null && { header: config.roles.assistant.name }),
          contentRender: (content, info) => {
            const parts = partsMap.get(info.key);
            return (
              <MessageBubble
                content={content}
                isStreaming={isStreaming}
                parts={parts}
                config={config}
                addToolApprovalResponse={addToolApprovalResponse}
                actions={config?.actions}
                messageId={info.key}
                onFeedback={onFeedback}
              />
            );
          },
        },
      }}
      autoScroll
      style={{ height: '100%' }}
    />
  );
}

export default MessageList;
