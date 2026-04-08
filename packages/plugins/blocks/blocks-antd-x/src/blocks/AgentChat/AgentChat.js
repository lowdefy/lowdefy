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
import { Prompts, Sender } from '@ant-design/x';
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
    suggestions,
  } = properties;
  const senderRef = useRef(null);
  const finishMetaRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const attachmentsConfig = sender?.attachments;

  // Sidebar driven entirely by external config
  const showSidebar = conversationsConfig?.enabled;
  const sidebarItems = conversationsConfig?.items ?? [];
  const activeKey = conversationsConfig?.activeKey;

  const transport = useMemo(() => new LowdefyChatTransport({ pageId, agentId }), [pageId, agentId]);

  const bubbleListRef = useRef(null);

  const {
    messages,
    sendMessage,
    status,
    stop,
    addToolApprovalResponse,
    setMessages,
    regenerate,
    clearError,
  } = useChat({
    transport,
    experimental_throttle: 50,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (error) => {
      methods.triggerEvent({
        name: 'onError',
        event: { message: error.message },
      });
    },
    onFinish: (options) => {
      finishMetaRef.current = {
        finishReason: options.finishReason,
        isAbort: options.isAbort,
        isDisconnect: options.isDisconnect,
      };
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

  // Register CallMethod methods so YAML actions can control the chat.
  useEffect(() => {
    methods.registerMethod('regenerate', (args) => {
      regenerate(args?.messageId ? { messageId: args.messageId } : undefined);
    });
    methods.registerMethod('setMessages', (args) => {
      setMessages(args?.messages ?? []);
    });
    methods.registerMethod('sendMessage', (args) => {
      if (args?.text) sendMessage({ text: args.text });
    });
    methods.registerMethod('clearMessages', () => {
      setMessages([]);
    });
    methods.registerMethod('deleteMessage', (args) => {
      if (args?.messageId) {
        setMessages((prev) => prev.filter((m) => m.id !== args.messageId));
      }
    });
    methods.registerMethod('stop', () => {
      stop();
    });
    methods.registerMethod('clearError', () => {
      clearError();
    });
    methods.registerMethod('scrollToBottom', () => {
      bubbleListRef.current?.scrollTo({ top: 'bottom' });
    });
  }, []);

  useAgentEvents({ messages, status, methods, finishMetaRef });

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

  function handleConversationMenuClick({ action, conversationKey, conversation }) {
    methods.triggerEvent({
      name: 'onConversationMenuClick',
      event: { action, conversationKey, conversation },
    });
  }

  function fileToContentPart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ type: 'file', url: reader.result, mediaType: file.type });
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSend(text) {
    if (!text.trim() && attachedFiles.length === 0) return;

    // Build file metadata for the event payload
    const filesMeta = attachedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    // Fire onBeforeSend — blocking event. If success is false, cancel the send.
    const response = await methods.triggerEvent({
      name: 'onBeforeSend',
      event: { text, files: filesMeta, messages },
    });
    if (response.success === false) return;

    // Check if any action response contains replacement file URLs.
    // Developers upload files to S3 in their action chain and return URLs.
    let replacementFiles = null;
    if (response.responses) {
      for (const actionResult of Object.values(response.responses)) {
        if (actionResult.response?.files && Array.isArray(actionResult.response.files)) {
          replacementFiles = actionResult.response.files;
          break;
        }
      }
    }

    if (attachedFiles.length > 0) {
      const parts = [{ type: 'text', text }];
      if (replacementFiles) {
        // Use URL-based file parts from onBeforeSend response
        for (const file of replacementFiles) {
          parts.push({ type: 'file', url: file.url, mediaType: file.mediaType });
        }
      } else {
        // Fall back to base64 data URLs
        for (const file of attachedFiles) {
          const part = await fileToContentPart(file);
          parts.push(part);
        }
      }
      sendMessage({ parts });
      setAttachedFiles([]);
    } else {
      sendMessage({ text });
    }
    senderRef.current?.clear();
  }

  function handleStop() {
    stop();
    methods.triggerEvent({
      name: 'onStop',
      event: { messages },
    });
  }

  function handlePromptClick(prompt) {
    sendMessage({ text: prompt.label });
  }

  function handleSuggestionClick(suggestion) {
    methods.triggerEvent({
      name: 'onSuggestionClick',
      event: { suggestion },
    });
    sendMessage({ text: suggestion.label });
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

  function handleRegenerate({ messageId }) {
    methods.triggerEvent({
      name: 'onRegenerate',
      event: { messageId, messages },
    });
    regenerate({ messageId });
  }

  function handleEditMessage({ messageId, originalContent, newContent }) {
    methods.triggerEvent({
      name: 'onEditMessage',
      event: { messageId, originalContent, newContent, messages },
    });
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex >= 0) {
      setMessages((prev) => prev.slice(0, messageIndex));
      sendMessage({ text: newContent });
    }
  }

  function handleDelete({ messageId }) {
    const message = messages.find((m) => m.id === messageId);
    const textContent =
      message?.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? '';
    methods.triggerEvent({
      name: 'onDeleteMessage',
      event: { messageId, content: textContent, messages },
    });
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
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
          onMenuClick={handleConversationMenuClick}
          menu={conversationsConfig?.menu}
          creation={conversationsConfig?.creation}
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
              ref={bubbleListRef}
              messages={messages}
              isStreaming={isBusy}
              config={messageDisplay}
              addToolApprovalResponse={addToolApprovalResponse}
              onFeedback={handleFeedback}
              onRegenerate={handleRegenerate}
              onDelete={handleDelete}
              onEditMessage={handleEditMessage}
            />
          )}
        </div>
        {!isEmpty && suggestions && suggestions.length > 0 && !isBusy && (
          <div style={{ padding: '0 16px 8px' }}>
            <Prompts
              items={suggestions.map((s, i) => ({
                key: s.key ?? `suggestion-${i}`,
                label: s.label,
                description: s.description,
              }))}
              onItemClick={({ data }) => handleSuggestionClick(data)}
              wrap
            />
          </div>
        )}
        <div style={{ padding: '8px 16px 24px' }}>
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
            submitType={sender?.submitType ?? 'enter'}
            allowSpeech={sender?.allowSpeech ?? false}
            onSubmit={handleSend}
            onCancel={handleStop}
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
