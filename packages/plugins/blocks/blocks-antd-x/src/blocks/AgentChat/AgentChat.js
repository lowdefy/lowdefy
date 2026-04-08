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

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { FileCard, Sender } from '@ant-design/x';
import { Button } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';

import { type } from '@lowdefy/helpers';

import { getFileCardType, getFileCardIcon } from './fileCardUtils.js';

import ConversationSidebar from './ConversationSidebar.js';
import DrawerWrapper from './DrawerWrapper.js';
import LowdefyChatTransport from './LowdefyChatTransport.js';
import MessageList from './MessageList.js';
import useAgentEvents from './useAgentEvents.js';
import WelcomeScreen from './WelcomeScreen.js';

function AgentChat({ blockId, methods, pageId, properties }) {
  const {
    agentId,
    welcome,
    messageDisplay,
    sender,
    conversations: conversationsConfig,
    messages: externalMessages,
    display,
    drawer: drawerConfig,
  } = properties;
  const senderRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const attachmentsConfig = sender?.attachments;

  // Sidebar driven entirely by external config
  const showSidebar = conversationsConfig?.enabled;
  const sidebarItems = conversationsConfig?.items ?? [];
  const activeKey = conversationsConfig?.activeKey;

  const transport = useMemo(() => new LowdefyChatTransport({ pageId, agentId }), [pageId, agentId]);

  const { messages, sendMessage, status, stop, addToolApprovalResponse, setMessages } = useChat({
    transport,
    experimental_throttle: 50,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (error) => {
      methods.triggerEvent({
        name: 'onError',
        event: { message: error.message },
      });
    },
  });

  // Clear messages when activeKey changes so the new conversation starts clean.
  // Developers load saved messages via the messages property if needed.
  const prevActiveKeyRef = useRef(activeKey);
  useEffect(() => {
    if (activeKey !== prevActiveKeyRef.current) {
      prevActiveKeyRef.current = activeKey;
      setMessages([]);
    }
  }, [activeKey, setMessages]);

  // Sync external messages when provided — undefined means "not provided" (no sync),
  // null means "clear messages", array means "load these messages".
  useEffect(() => {
    if (!type.isUndefined(externalMessages)) {
      setMessages(externalMessages ?? []);
    }
  }, [externalMessages, setMessages]);

  useAgentEvents({ messages, status, methods });

  const isEmpty = messages.length === 0;
  const isBusy = status === 'streaming' || status === 'submitted';

  function handleConversationChange(key, previousKey) {
    methods.triggerEvent({
      name: 'onConversationChange',
      event: { key, previousKey },
    });
  }

  function handleNewConversation() {
    methods.triggerEvent({
      name: 'onNewConversation',
      event: {},
    });
  }

  function fileToContentPart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ type: 'file', url: reader.result, mediaType: file.type, filename: file.name });
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSend(text) {
    if (!text.trim() && attachedFiles.length === 0) return;
    if (attachedFiles.length > 0) {
      const parts = [{ type: 'text', text }];
      for (const file of attachedFiles) {
        const part = await fileToContentPart(file);
        parts.push(part);
      }
      sendMessage({ parts });
      setAttachedFiles([]);
    } else {
      sendMessage({ text });
    }
    senderRef.current?.clear();
  }

  function handlePromptClick(prompt) {
    sendMessage({ text: prompt.label });
  }

  function handleFeedback({ messageId, rating }) {
    const message = messages.find((msg) => msg.id === messageId);
    const messageContent =
      message?.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('') ?? '';
    methods.triggerEvent({
      name: 'onFeedback',
      event: { messageId, messageContent, rating },
    });
  }

  const chatContent = (
    <div
      id={blockId}
      style={{
        display: 'flex',
        height: display === 'drawer' ? '100%' : properties.height ?? 'calc(100dvh - 170px)',
      }}
    >
      {showSidebar && (
        <ConversationSidebar
          items={sidebarItems}
          activeKey={activeKey}
          onConversationChange={handleConversationChange}
          onNewConversation={handleNewConversation}
        />
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: properties.maxWidth ?? 800,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, padding: '16px 0' }}>
          {isEmpty ? (
            <WelcomeScreen config={welcome} onPromptClick={handlePromptClick} />
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isBusy}
              config={messageDisplay}
              addToolApprovalResponse={addToolApprovalResponse}
              onFeedback={handleFeedback}
            />
          )}
        </div>
        <div style={{ padding: '8px 16px 24px' }}>
          {attachmentsConfig?.enabled && attachedFiles.length > 0 && (
            <FileCard.List
              style={{ marginBottom: 4 }}
              items={attachedFiles.map((file, i) => {
                const cardType = getFileCardType(file.type);
                return {
                  key: `${i}`,
                  name: file.name,
                  byte: file.size,
                  type: cardType,
                  icon: getFileCardIcon(file.type, file.name),
                  src: cardType === 'image' ? URL.createObjectURL(file) : undefined,
                };
              })}
              removable
              onRemove={(item) => {
                setAttachedFiles((prev) => {
                  const idx = prev.findIndex((f) => f.name === item.name && f.size === item.byte);
                  return idx !== -1 ? prev.filter((_, j) => j !== idx) : prev;
                });
              }}
              overflow="wrap"
              size="small"
            />
          )}
          {attachmentsConfig?.enabled && (
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept={attachmentsConfig.accept}
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const valid = files.filter(
                  (f) => !(attachmentsConfig.maxSize && f.size > attachmentsConfig.maxSize)
                );
                setAttachedFiles((prev) => [...prev, ...valid]);
                e.target.value = '';
              }}
            />
          )}
          <Sender
            ref={senderRef}
            placeholder={sender?.placeholder ?? 'Type a message...'}
            onSubmit={handleSend}
            onCancel={stop}
            loading={isBusy}
            prefix={
              attachmentsConfig?.enabled ? (
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                />
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );

  if (display === 'drawer') {
    return <DrawerWrapper config={drawerConfig}>{chatContent}</DrawerWrapper>;
  }

  return chatContent;
}

AgentChat.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default AgentChat;
