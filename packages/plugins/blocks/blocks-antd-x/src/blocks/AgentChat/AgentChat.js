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

import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { Sender } from '@ant-design/x';
import { Button, Tag, Upload } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { type } from '@lowdefy/helpers';

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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const attachmentsConfig = sender?.attachments;

  // --- Conversation state (managed internally when conversations.enabled) ---
  const conversationsEnabled = conversationsConfig?.enabled;
  const conversationCounterRef = useRef(0);
  const conversationMapRef = useRef(new Map());

  function createConversation(label) {
    conversationCounterRef.current += 1;
    const count = conversationCounterRef.current;
    const key = `conv_${Date.now()}_${count}`;
    return { key, label: label ?? `Chat ${count}` };
  }

  const [conversationItems, setConversationItems] = useState(() => {
    if (!conversationsEnabled) return [];
    const first = createConversation();
    return [first];
  });
  const [activeConversationKey, setActiveConversationKey] = useState(
    () => conversationItems[0]?.key ?? null
  );

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

  // Save current messages into the conversation map.
  const saveCurrentMessages = useCallback(() => {
    if (activeConversationKey) {
      conversationMapRef.current.set(activeConversationKey, [...messages]);
    }
  }, [activeConversationKey, messages]);

  function handleConversationChange(key, previousKey) {
    saveCurrentMessages();
    const restored = conversationMapRef.current.get(key) ?? [];
    setMessages(restored);
    setActiveConversationKey(key);
    methods.triggerEvent({
      name: 'onConversationChange',
      event: { key, previousKey },
    });
  }

  function handleNewConversation() {
    saveCurrentMessages();
    const conversation = createConversation();
    setConversationItems((prev) => [...prev, conversation]);
    setActiveConversationKey(conversation.key);
    setMessages([]);
    methods.triggerEvent({
      name: 'onNewConversation',
      event: { key: conversation.key, label: conversation.label },
    });
  }

  function fileToContentPart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (file.type.startsWith('image/')) {
          resolve({ type: 'image', image: dataUrl });
        } else {
          resolve({ type: 'file', data: dataUrl.split(',')[1], mimeType: file.type });
        }
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
        height: display === 'drawer' ? '100%' : (properties.height ?? 'calc(100dvh - 170px)'),
      }}
    >
      {conversationsEnabled && (
        <ConversationSidebar
          items={conversationItems}
          activeKey={activeConversationKey}
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
        <div style={{ padding: '8px 0 16px' }}>
          {sender?.suggestions?.length > 0 && isEmpty && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {sender.suggestions.map((s, i) => (
                <Button
                  key={`suggestion-${i}`}
                  size="small"
                  onClick={() => handleSend(s.value ?? s.label)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          )}
          {attachmentsConfig?.enabled && attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
              {attachedFiles.map((file, i) => (
                <Tag
                  key={i}
                  closable
                  onClose={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                >
                  {file.name}
                </Tag>
              ))}
            </div>
          )}
          <Sender
            ref={senderRef}
            placeholder={sender?.placeholder ?? 'Type a message...'}
            onSubmit={handleSend}
            onCancel={stop}
            loading={isBusy}
            prefix={
              attachmentsConfig?.enabled ? (
                <Upload
                  beforeUpload={(file) => {
                    if (attachmentsConfig.maxSize && file.size > attachmentsConfig.maxSize) {
                      return false;
                    }
                    setAttachedFiles((prev) => [...prev, file]);
                    return false;
                  }}
                  accept={attachmentsConfig.accept}
                  showUploadList={false}
                  multiple
                >
                  <Button type="text" icon={<PaperClipOutlined />} />
                </Upload>
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
