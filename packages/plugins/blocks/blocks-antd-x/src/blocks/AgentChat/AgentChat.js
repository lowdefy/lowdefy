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
import getLegacyObjectUrl from '@lowdefy/blocks-files/utils/getLegacyObjectUrl.js';
import getUploadPolicy from '@lowdefy/blocks-files/utils/getUploadPolicy.js';
import uploadFile from '@lowdefy/blocks-files/utils/uploadFile.js';

import { getFileCardType, getFileCardIcon } from './fileCardUtils.js';

import DrawerWrapper from './DrawerWrapper.js';
import createLowdefyChatTransport from './LowdefyChatTransport.js';
import MessageList from './MessageList.js';
import useAgentEvents, { collectExternalEventIds } from './useAgentEvents.js';
import WelcomeScreen from './WelcomeScreen.js';

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
  const uploadPolicyRequestId =
    attachmentsConfig?.uploadPolicyRequestId ?? attachmentsConfig?.s3PostPolicyRequestId;
  const downloadPolicyRequestId = attachmentsConfig?.downloadPolicyRequestId;
  const switchConfigs = sender?.switches ?? [];
  const [headerOpen, setHeaderOpen] = useState(sender?.header?.open ?? true);
  const [switchState, setSwitchState] = useState(() => {
    const initial = {};
    for (const sw of switchConfigs) {
      initial[sw.key] = sw.default ?? false;
    }
    return initial;
  });

  // When no conversationId is supplied, mint a stable session id so every turn
  // (including a welcome prompt sent before the app sets the prop) posts a
  // consistent id. App-supplied ids remain authoritative.
  const mintedIdRef = useRef(null);
  if (!conversationId && !mintedIdRef.current) {
    mintedIdRef.current = crypto.randomUUID();
  }
  const effectiveConversationId = conversationId ?? mintedIdRef.current;

  const urlQueryKey = JSON.stringify(urlQuery ?? null);
  const transport = useMemo(
    () =>
      createLowdefyChatTransport({
        pageId,
        agentId,
        conversationId: effectiveConversationId,
        urlQuery,
        sharedStateRef,
      }),
    [pageId, agentId, effectiveConversationId, urlQueryKey]
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
            await methods.triggerEvent({ name: '__updatePageState', event: writable });
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
        } catch (err) {
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
    onData: (dataPart) => {
      methods.triggerEvent({
        name: 'onDataPart',
        event: { type: dataPart.type, data: dataPart.data, id: dataPart.id },
      });
    },
  });

  // Clear messages when conversationId changes so the new conversation starts clean.
  // Developers load saved messages via the messages property if needed.
  const prevConversationIdRef = useRef(effectiveConversationId);
  useEffect(() => {
    if (effectiveConversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = effectiveConversationId;
      setMessages([]);
    }
  }, [effectiveConversationId, setMessages]);

  // Sync external messages when provided — undefined means "not provided" (no sync),
  // null means "clear messages", array means "load these messages".
  // Compare by count + last ID to avoid re-syncing on every Lowdefy re-render
  // (operators like _state create new array references even when data hasn't changed).
  const prevExternalRef = useRef({ count: 0, lastId: null });
  // Event-dedup ids of externally loaded messages. Restored history must not
  // replay onToolCall / onToolResult / onUserMessage / onTitleGenerated side
  // effects — useAgentEvents suppresses ids in this ref.
  const externalIdsRef = useRef(null);
  useEffect(() => {
    if (type.isUndefined(externalMessages)) return;
    const msgs = externalMessages ?? [];
    const count = msgs.length;
    const lastId = count > 0 ? msgs[count - 1]?.id : null;
    if (count !== prevExternalRef.current.count || lastId !== prevExternalRef.current.lastId) {
      prevExternalRef.current = { count, lastId };
      externalIdsRef.current = collectExternalEventIds(msgs);
      setMessages(msgs);
    }
  }, [externalMessages, setMessages]);

  // Register CallMethod methods so YAML actions can control the chat.
  useEffect(() => {
    methods.registerMethod('regenerate', (args) => {
      regenerate(args?.messageId ? { messageId: args.messageId } : undefined);
    });
    methods.registerMethod('setMessages', (args) => {
      const msgs = args?.messages ?? [];
      externalIdsRef.current = collectExternalEventIds(msgs);
      setMessages(msgs);
    });
    methods.registerMethod('sendMessage', (args) => {
      if (args?.text) {
        sendMessage({
          text: args.text,
          ...(args.files ? { files: args.files } : {}),
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
    if (uploadPolicyRequestId) {
      if (attachmentsConfig?.s3PostPolicyRequestId) {
        console.warn(
          'AgentChat attachments property "s3PostPolicyRequestId" is deprecated. Use "uploadPolicyRequestId" instead.'
        );
      }
      methods.registerEvent({
        name: '__getUploadPolicy',
        actions: [
          {
            id: '__getUploadPolicy',
            type: 'Request',
            params: [uploadPolicyRequestId],
          },
        ],
      });
      if (downloadPolicyRequestId) {
        methods.registerEvent({
          name: '__getDownloadPolicy',
          actions: [
            {
              id: '__getDownloadPolicy',
              type: 'Request',
              params: [downloadPolicyRequestId],
            },
          ],
        });
      }
    }
  }, []);

  useAgentEvents({
    messages,
    status,
    methods,
    finishMetaRef,
    conversationId: effectiveConversationId,
    externalIdsRef,
  });

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

  async function uploadFileToStorage(file) {
    const { name, type: fileType } = file;
    const descriptor = await getUploadPolicy({ methods, file });

    await uploadFile({ descriptor, file });

    // The model provider fetches this URL, so resolve it through the download
    // request when configured (stable public URL or signed URL). Otherwise
    // fall back to the legacy unsigned object URL from the descriptor.
    let objectUrl;
    if (downloadPolicyRequestId) {
      const response = await methods.triggerEvent({
        name: '__getDownloadPolicy',
        event: {
          file: { bucket: descriptor.bucket, key: descriptor.key, name, type: fileType },
        },
      });
      if (response.success !== true) {
        throw new Error('Download policy request failed.');
      }
      objectUrl = response.responses.__getDownloadPolicy.response[0];
    } else {
      objectUrl = getLegacyObjectUrl({ descriptor });
    }
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

      if (uploadPolicyRequestId) {
        try {
          const uploadResults = await Promise.all(
            attachedFiles.map((file) => uploadFileToStorage(file))
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
            event: { message: error.message ?? 'File upload failed.' },
          });
          return;
        }
      } else {
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
            translate={methods.translate}
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
          placeholder={sender?.placeholder ?? methods.translate('agent.sender.placeholder')}
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
};

export default AgentChat;
