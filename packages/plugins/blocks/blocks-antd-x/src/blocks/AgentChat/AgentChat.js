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
import {
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { FileCard, Prompts, Sender } from '@ant-design/x';
import { Button } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';

import { type } from '@lowdefy/helpers';

import { getFileCardType, getFileCardIcon } from './fileCardUtils.js';

import createClientPhaseLogger from './clientPhaseLogger.js';
import DrawerWrapper from './DrawerWrapper.js';
import createLowdefyChatTransport from './LowdefyChatTransport.js';
import MessageList from './MessageList.js';
import useAgentEvents from './useAgentEvents.js';
import WelcomeScreen from './WelcomeScreen.js';

function generateTurnId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function AgentChat({ blockId, components: { Icon }, methods, pageId, properties }) {
  const {
    agentId,
    urlQuery,
    sharedState,
    welcome,
    messageDisplay,
    sender,
    conversationId,
    messages: externalMessages,
    display,
    drawer: drawerConfig,
    suggestions,
  } = properties;
  const senderRef = useRef(null);
  const finishMetaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  // Mirror the operator-evaluated sharedState object into a ref so transport.body()
  // sees the freshest value at send time without re-constructing the transport.
  const sharedStateRef = useRef(null);
  sharedStateRef.current =
    type.isObject(sharedState) && Object.keys(sharedState).length > 0 ? sharedState : null;
  const attachmentsConfig = sender?.attachments;
  const switchConfigs = sender?.switches ?? [];
  const [headerOpen, setHeaderOpen] = useState(sender?.header?.open ?? true);
  const [switchState, setSwitchState] = useState(() => {
    const initial = {};
    for (const sw of switchConfigs) {
      initial[sw.key] = sw.default ?? false;
    }
    return initial;
  });

  // Client-side phase logger: off by default; enable via
  //   window.__LOWDEFY_AGENT_TRACE__ = true  OR
  //   localStorage.lowdefyAgentTrace = '1'
  const phaseLoggerRef = useRef(null);
  if (phaseLoggerRef.current === null) {
    phaseLoggerRef.current = createClientPhaseLogger({ agentId, pageId, conversationId });
  }
  const turnIdRef = useRef(null);

  const urlQueryKey = JSON.stringify(urlQuery ?? null);
  const transport = useMemo(
    () =>
      createLowdefyChatTransport({
        pageId,
        agentId,
        conversationId,
        urlQuery,
        sharedStateRef,
        turnIdRef,
        phaseLoggerRef,
      }),
    [pageId, agentId, conversationId, urlQueryKey]
  );

  const bubbleListRef = useRef(null);

  const {
    messages,
    sendMessage,
    status,
    stop,
    addToolApprovalResponse,
    addToolOutput,
    setMessages,
    regenerate,
    clearError,
  } = useChat({
    transport,
    experimental_throttle: 50,
    sendAutomaticallyWhen: (args) =>
      lastAssistantMessageIsCompleteWithToolCalls(args) ||
      lastAssistantMessageIsCompleteWithApprovalResponses(args),
    async onToolCall({ toolCall }) {
      phaseLoggerRef.current?.phase('client.onToolCall', {
        toolName: toolCall.toolName,
        dynamic: toolCall.dynamic === true,
        toolCallId: toolCall.toolCallId,
      });
      if (toolCall.dynamic) return;
      if (toolCall.toolName === 'update-page-state') {
        try {
          const updates = toolCall.input?.updates ?? {};
          // Allowlist writes against the keys currently exposed via sharedState —
          // the tool's description tells the agent "keys must match field names
          // visible in shared state", but we enforce it here so a hallucinated
          // key can't mutate arbitrary page state.
          const allowedKeys = new Set(Object.keys(sharedStateRef.current ?? {}));
          const writable = {};
          const ignored = [];
          for (const [key, value] of Object.entries(updates)) {
            if (allowedKeys.has(key)) writable[key] = value;
            else ignored.push(key);
          }
          if (Object.keys(writable).length > 0) {
            await phaseLoggerRef.current.time(
              'client.update_page_state.trigger_event',
              () => methods.triggerEvent({ name: '__updatePageState', event: writable }),
              { keyCount: Object.keys(writable).length }
            );
          }
          addToolOutput({
            tool: 'update-page-state',
            toolCallId: toolCall.toolCallId,
            output: {
              ok: true,
              written: Object.keys(writable),
              ...(ignored.length > 0 ? { ignored } : {}),
            },
          });
          phaseLoggerRef.current?.phase('client.update_page_state.output', {
            written: Object.keys(writable).length,
            ignored: ignored.length,
          });
        } catch (err) {
          phaseLoggerRef.current?.phase('client.update_page_state.error', {
            err: err?.message,
          });
          addToolOutput({
            tool: 'update-page-state',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: err.message,
          });
        }
      }
    },
    onError: (error) => {
      phaseLoggerRef.current?.phase('client.onError', { message: error?.message });
      methods.triggerEvent({
        name: 'onError',
        event: { message: error.message },
      });
    },
    onFinish: (options) => {
      phaseLoggerRef.current?.phase('client.onFinish', {
        finishReason: options.finishReason,
        isAbort: options.isAbort === true,
        isDisconnect: options.isDisconnect === true,
      });
      finishMetaRef.current = {
        finishReason: options.finishReason,
        isAbort: options.isAbort,
        isDisconnect: options.isDisconnect,
      };
    },
    onData: (dataPart) => {
      phaseLoggerRef.current?.phase('client.onData', { type: dataPart.type, id: dataPart.id });
      methods.triggerEvent({
        name: 'onDataPart',
        event: { type: dataPart.type, data: dataPart.data, id: dataPart.id },
      });
    },
  });

  // Start a new turn on every outbound sendMessage so client+server logs share turnId.
  const trackedSendMessage = useMemo(
    () => (args) => {
      const turnId = generateTurnId();
      turnIdRef.current = turnId;
      phaseLoggerRef.current?.setTurn?.(turnId);
      phaseLoggerRef.current?.phase('client.turn.start', {
        hasText: typeof args?.text === 'string',
        partCount: Array.isArray(args?.parts) ? args.parts.length : undefined,
      });
      return sendMessage(args);
    },
    [sendMessage]
  );

  // Clear messages when conversationId changes so the new conversation starts clean.
  // Developers load saved messages via the messages property if needed.
  const prevConversationIdRef = useRef(conversationId);
  useEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversationId;
      setMessages([]);
    }
  }, [conversationId, setMessages]);

  // Sync external messages when provided — undefined means "not provided" (no sync),
  // null means "clear messages", array means "load these messages".
  // Compare by count + last ID to avoid re-syncing on every Lowdefy re-render
  // (operators like _state create new array references even when data hasn't changed).
  const prevExternalRef = useRef({ count: 0, lastId: null });
  useEffect(() => {
    if (type.isUndefined(externalMessages)) return;
    const msgs = externalMessages ?? [];
    const count = msgs.length;
    const lastId = count > 0 ? msgs[count - 1]?.id : null;
    if (count !== prevExternalRef.current.count || lastId !== prevExternalRef.current.lastId) {
      prevExternalRef.current = { count, lastId };
      setMessages(msgs);
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
      if (args?.text) {
        trackedSendMessage({
          text: args.text,
          ...(args.files ? { experimental_attachments: args.files } : {}),
          ...(args.metadata ? { metadata: args.metadata } : {}),
        });
      }
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
    methods.registerEvent({
      name: '__updatePageState',
      actions: [{ id: 'setState', type: 'SetState', params: { _event: true } }],
    });
    if (attachmentsConfig?.s3PostPolicyRequestId) {
      methods.registerEvent({
        name: '__getS3PostPolicy',
        actions: [
          {
            id: '__getS3PostPolicy',
            type: 'Request',
            params: [attachmentsConfig.s3PostPolicyRequestId],
          },
        ],
      });
    }
  }, []);

  useAgentEvents({ messages, status, methods, finishMetaRef, phaseLoggerRef });

  const isEmpty = messages.length === 0;
  const isBusy = status === 'streaming' || status === 'submitted';

  function fileToContentPart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ type: 'file', url: reader.result, mediaType: file.type, filename: file.name });
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadFileToS3(file) {
    const { name, size, type: fileType } = file;
    const s3PostPolicyResponse = await methods.triggerEvent({
      name: '__getS3PostPolicy',
      event: { file: { name, size, type: fileType } },
    });

    if (s3PostPolicyResponse.success !== true) {
      throw new Error('S3 post policy request failed.');
    }

    const { url, fields = {} } = s3PostPolicyResponse.responses.__getS3PostPolicy.response[0];
    const { key } = fields;

    const formData = new FormData();
    Object.keys(fields).forEach((field) => {
      formData.append(field, fields[field]);
    });
    formData.append('file', file);

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('S3 upload network error')));
      xhr.open('POST', url);
      xhr.send(formData);
    });

    const objectUrl = url.endsWith('/') ? `${url}${key}` : `${url}/${key}`;
    return { url: objectUrl, mediaType: fileType, filename: name };
  }

  async function handleSend(text) {
    if (!text.trim() && attachedFiles.length === 0) return;

    const filesMeta = attachedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    // onBeforeSend — validation and cancellation only
    const response = await methods.triggerEvent({
      name: 'onBeforeSend',
      event: { text, files: filesMeta, messages, switches: switchState },
    });
    if (response.success === false) return;

    if (attachedFiles.length > 0) {
      const parts = [{ type: 'text', text }];

      if (attachmentsConfig?.s3PostPolicyRequestId) {
        try {
          const uploadResults = await Promise.all(
            attachedFiles.map((file) => uploadFileToS3(file))
          );
          for (const result of uploadResults) {
            parts.push({
              type: 'file',
              url: result.url,
              mediaType: result.mediaType,
              filename: result.filename,
            });
          }
        } catch (error) {
          methods.triggerEvent({
            name: 'onError',
            event: { message: error.message ?? 'File upload to S3 failed.' },
          });
          return;
        }
      } else {
        for (const file of attachedFiles) {
          const part = await fileToContentPart(file);
          parts.push(part);
        }
      }

      trackedSendMessage({ parts });
      setAttachedFiles([]);
    } else {
      trackedSendMessage({ text });
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
    trackedSendMessage({ text: prompt.label });
  }

  function handleSuggestionClick(suggestion) {
    methods.triggerEvent({
      name: 'onSuggestionClick',
      event: { suggestion },
    });
    trackedSendMessage({ text: suggestion.label });
  }

  function handleSwitchChange(key, checked) {
    setSwitchState((prev) => ({ ...prev, [key]: checked }));
    methods.triggerEvent({
      name: 'onSwitchChange',
      event: { key, checked },
    });
  }

  const agentSuggestions = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant?.parts) return null;
    const suggestionPart = [...lastAssistant.parts]
      .reverse()
      .find((p) => p.type === 'data-suggestions');
    return suggestionPart?.data?.items ?? null;
  }, [messages]);

  const activeSuggestions = agentSuggestions ?? suggestions;

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
      trackedSendMessage({ text: newContent });
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
        flexDirection: 'column',
        height: display === 'drawer' ? '100%' : properties.height ?? 'calc(100dvh - 170px)',
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
      {!isEmpty && activeSuggestions && activeSuggestions.length > 0 && !isBusy && (
        <div style={{ padding: '0 16px 8px' }}>
          <Prompts
            items={activeSuggestions.map((s, i) => ({
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
          submitType={sender?.submitType ?? 'enter'}
          allowSpeech={sender?.allowSpeech ?? false}
          onSubmit={handleSend}
          onCancel={handleStop}
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
          header={
            sender?.header ? (
              <Sender.Header
                title={sender.header.title}
                closable={sender.header.closable ?? true}
                open={headerOpen}
                onOpenChange={setHeaderOpen}
              >
                {sender.header.content}
              </Sender.Header>
            ) : undefined
          }
          footer={
            switchConfigs.length > 0
              ? switchConfigs.map((sw) => (
                  <Sender.Switch
                    key={sw.key}
                    value={switchState[sw.key] ?? false}
                    onChange={(checked) => handleSwitchChange(sw.key, checked)}
                    icon={
                      sw.icon ? (
                        <Icon
                          blockId={`${blockId}_switch_${sw.key}_icon`}
                          events={{}}
                          properties={sw.icon}
                        />
                      ) : undefined
                    }
                  >
                    {sw.label}
                  </Sender.Switch>
                ))
              : undefined
          }
        />
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
