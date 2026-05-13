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
import { Bubble, FileCard } from '@ant-design/x';
import { Avatar } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';

import { getFileCardType, getFileCardIcon, getFileName } from './fileCardUtils.js';
import { hasVisibleContent } from './messageParts.js';
import MessageBubble from './MessageBubble.js';
import ThinkingIndicator from './ThinkingIndicator.js';
import useThinkingMessage from './useThinkingMessage.js';

function roleAvatar(roleConfig, fallbackIcon) {
  if (roleConfig?.avatar) {
    return <Avatar src={roleConfig.avatar} />;
  }
  return <Avatar icon={fallbackIcon} />;
}

function roleHeader(roleConfig, fallbackKey, translate) {
  const name = roleConfig?.name ?? translate(fallbackKey);
  return <h5 style={{ margin: 0 }}>{name}</h5>;
}

// Rendered inside a bubble's loadingRender while it shows dots. Lives in its own
// component so useThinkingMessage's timers mount/unmount with the loading state:
// when a visible part arrives → loading flips false → this component unmounts →
// effect cleanup clears the delay timeout and rotation interval.
function ThinkingBubbleContent({ bubbleId, config }) {
  const label = useThinkingMessage({
    active: true,
    messages: config?.thinkingMessages,
    delay: config?.thinkingMessageDelay,
    interval: config?.thinkingMessageRotationInterval,
    resetKey: bubbleId,
  });
  return <ThinkingIndicator label={label} />;
}

const MessageList = React.forwardRef(function MessageList(
  {
    messages,
    isStreaming,
    config,
    addToolApprovalResponse,
    onFeedback,
    onRegenerate,
    onDelete,
    onEditMessage,
    translate,
  },
  ref
) {
  // Build a lookup map for message parts.
  // Bubble.List's contentRender callback only receives (content, info) where info.key is the
  // item key — it does not receive the full message object with its parts array. This map
  // bridges that gap so MessageBubble can render tool calls, reasoning, etc. for assistant
  // messages and FileCard previews for user file attachments.
  const partsMap = new Map(messages.map((msg) => [msg.id, msg.parts]));

  const lastMessage = messages[messages.length - 1];
  const showStepSeparators = config?.showStepSeparators ?? false;

  const items = [];
  for (const msg of messages) {
    const isLastAssistant = msg === lastMessage && msg.role === 'assistant';
    const textContent =
      msg.parts
        ?.filter(
          (part) => part.type === 'text' && part.providerMetadata?.openai?.phase !== 'commentary'
        )
        .map((part) => part.text)
        .join('') ?? '';

    if (showStepSeparators && msg.role === 'assistant') {
      const stepParts = (msg.parts ?? []).filter((p) => p.type === 'step-start');
      if (stepParts.length > 1) {
        items.push({ key: `divider-${msg.id}`, role: 'divider' });
      }
    }

    // Show loading dots while the agent is working on the last assistant bubble and
    // nothing visible has rendered yet. `hasVisibleContent` mirrors what MessageBubble
    // paints, so tool-only messages with showThoughtChain: false also keep dots.
    const showLoading =
      isStreaming && isLastAssistant && !hasVisibleContent(msg, config);

    items.push({
      key: msg.id,
      content: textContent,
      role: msg.role === 'user' ? 'user' : 'ai',
      loading: showLoading,
      loadingRender: showLoading
        ? () => <ThinkingBubbleContent bubbleId={msg.id} config={config} />
        : undefined,
      streaming: isStreaming && isLastAssistant,
    });
  }

  // When busy but no assistant message exists yet (submitted, waiting for first chunk),
  // append a placeholder so loading dots are visible immediately.
  //
  // Known cosmetic issue: the ThinkingBubbleContent here uses bubbleId="__loading",
  // while the real assistant bubble (once its first chunk lands) uses msg.id. If the
  // first chunk arrives after thinkingMessageDelay has already elapsed but brings
  // only invisible parts (e.g. a tool call with showThoughtChain: false), the
  // rotation timer resets and the label briefly disappears before the new bubble's
  // delay elapses again. Accepted for v1 — a turn-stable resetKey (e.g. last user
  // message id) would smooth this over but needs plumbing.
  if (isStreaming && lastMessage?.role !== 'assistant') {
    items.push({
      key: '__loading',
      content: '',
      role: 'ai',
      loading: true,
      loadingRender: () => <ThinkingBubbleContent bubbleId="__loading" config={config} />,
      streaming: true,
    });
  }

  return (
    <Bubble.List
      ref={ref}
      items={items}
      role={{
        user: {
          placement: 'end',
          variant: config?.roles?.user?.variant ?? 'filled',
          shape: config?.roles?.user?.shape ?? 'round',
          avatar: roleAvatar(config?.roles?.user, <UserOutlined />),
          header: roleHeader(config?.roles?.user, 'agent.message.userHeader', translate),
          editable:
            config?.editableMessages !== false
              ? {
                  onEditConfirm: (key, newContent) => {
                    const parts = partsMap.get(key);
                    const originalContent =
                      (parts ?? [])
                        .filter((p) => p.type === 'text')
                        .map((p) => p.text)
                        .join('') ?? '';
                    onEditMessage?.({
                      messageId: key,
                      originalContent,
                      newContent,
                    });
                  },
                }
              : undefined,
          contentRender: (content, info) => {
            const parts = partsMap.get(info.key);
            const fileParts = (parts ?? []).filter((p) => p.type === 'file');
            if (fileParts.length === 0) return content;
            const fileItems = fileParts.map((part, i) => {
              const cardType = getFileCardType(part.mediaType);
              return {
                key: `file-${i}`,
                name: getFileName(part),
                type: cardType,
                icon: getFileCardIcon(part.mediaType, part.filename),
                src: cardType === 'image' ? part.url : undefined,
                size: 'small',
              };
            });
            return (
              <div>
                <div style={{ marginBottom: content ? 8 : 0 }}>
                  {fileItems.length === 1 ? (
                    <FileCard {...fileItems[0]} />
                  ) : (
                    <FileCard.List items={fileItems} overflow="wrap" size="small" />
                  )}
                </div>
                {content && <div>{content}</div>}
              </div>
            );
          },
        },
        ai: {
          placement: 'start',
          variant: config?.roles?.assistant?.variant ?? 'outlined',
          shape: config?.roles?.assistant?.shape ?? 'default',
          style: { maxWidth: '100%' },
          avatar: roleAvatar(config?.roles?.assistant, <RobotOutlined />),
          header: roleHeader(config?.roles?.assistant, 'agent.message.assistantHeader', translate),
          typing: config?.roles?.assistant?.typing
            ? config.roles.assistant.typing
            : { effect: 'fade-in' },
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
                onRegenerate={onRegenerate}
                onDelete={onDelete}
                translate={translate}
              />
            );
          },
        },
      }}
      autoScroll
      style={{ height: '100%' }}
    />
  );
});

export default MessageList;
