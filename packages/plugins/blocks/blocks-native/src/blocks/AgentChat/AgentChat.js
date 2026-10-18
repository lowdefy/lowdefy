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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useChat } from '@ai-sdk/react';
import {
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { type } from '@lowdefy/helpers';
import { useScreenFooter } from '@lowdefy/client-native';

import AssistantMessage from './AssistantMessage.js';
import ChatComposer from './ChatComposer.js';
import ChatError from './ChatError.js';
import ChatSkeleton from './ChatSkeleton.js';
import createAgentTransport from './createAgentTransport.js';
import getMessageText from './getMessageText.js';
import getPageStateUpdates from './getPageStateUpdates.js';
import getTimelineColors from '../ActivityTimeline/getTimelineColors.js';
import { hasVisibleContent } from './messageParts.js';
import meta from './meta.js';
import replayableMessages from './replayableMessages.js';
import showMessageMenu from './showMessageMenu.js';
import ThinkingIndicator from './ThinkingIndicator.js';
import ThreadsSheet from './ThreadsSheet.js';
import useAgentEvents, { collectExternalEventIds } from './useAgentEvents.js';
import useChatThreads from './useChatThreads.js';
import useComponentTokens from '../../useComponentTokens.js';
import useFollowScroll from './useFollowScroll.js';
import useThinkingMessage from './useThinkingMessage.js';
import UserMessage from './UserMessage.js';
import WelcomeView from './WelcomeView.js';

const DEFAULT_ACTIONS = { copy: true, regenerate: true };

function normalizeActions(actions) {
  if (type.isArray(actions)) {
    return Object.fromEntries(actions.map((action) => [action, true]));
  }
  return type.isObject(actions) ? actions : DEFAULT_ACTIONS;
}

function toPrompts(list) {
  return (type.isArray(list) ? list : [])
    .map((item, index) => {
      if (type.isString(item)) return { key: `${index}`, label: item };
      if (type.isObject(item) && type.isString(item.label)) return { key: `${index}`, ...item };
      return null;
    })
    .filter((item) => item !== null);
}

/**
 * The native AgentChat: a conversation with one of the app's agents, as ChatGPT's and Claude's
 * iOS apps draw it. It takes the web block's properties, events and methods where a phone can
 * honour them, talks to the same agent route (createAgentTransport) and runs the same client
 * tool (update-page-state).
 *
 * The conversation is the page's content, so the page scrolls it (useFollowScroll keeps the
 * newest message in view); the composer is drawn in the Screen's footer, pinned above the tab
 * bar and the keyboard (useScreenFooter), unless `sender.sticky` is false. With `threads` set the
 * block keeps its conversations through the app's thread endpoints and lists them in a sheet
 * (useChatThreads).
 */
function AgentChat({
  blockId,
  components,
  events,
  loading,
  methods,
  pageId,
  pathParams,
  properties,
  styles: blockStyles = {},
}) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const colors = useMemo(() => getTimelineColors({ isDark, tokens }), [isDark, tokens]);
  const { translate } = methods;
  const config = properties.messageDisplay;
  const sender = type.isObject(properties.sender) ? properties.sender : {};
  const sticky = sender.sticky !== false;
  const { agentId, sharedState, urlQuery } = properties;

  // Read by the transport at send time, so a send carries the page's latest values.
  const sharedStateRef = useRef(null);
  sharedStateRef.current =
    type.isObject(sharedState) && Object.keys(sharedState).length > 0 ? sharedState : null;
  const sharedStateReadOnlyRef = useRef(false);
  sharedStateReadOnlyRef.current = properties.sharedStateReadOnly === true;

  const messagesRef = useRef([]);
  // Event-dedup ids of loaded history, so restored messages do not replay onToolCall and the rest.
  const externalIdsRef = useRef(null);
  // Client-side tools still running: their parts are unanswered until addToolOutput.
  const pendingToolCallsRef = useRef(new Set());
  const statusRef = useRef('ready');
  const finishMetaRef = useRef(null);
  const chatRef = useRef(null);
  const sendingRef = useRef(false);

  const onThreadLoaded = useCallback((messages) => {
    externalIdsRef.current = collectExternalEventIds(messages);
  }, []);
  const threads = useChatThreads({ messagesRef, methods, onThreadLoaded, properties });
  const threadsRef = useRef(threads);
  threadsRef.current = threads;
  const { conversationId } = threads;

  const urlQueryKey = JSON.stringify(urlQuery ?? null);
  const pathParamsKey = JSON.stringify(pathParams ?? null);
  const transport = useMemo(
    () =>
      createAgentTransport({
        agentId,
        conversationId,
        onRequest: ({ messages: sent, trigger }) =>
          threadsRef.current.onRequest({ conversationId, messages: sent, trigger }),
        pageId,
        pathParams,
        sharedStateRef,
        sharedStateReadOnlyRef,
        streamFetch: methods.streamFetch,
        urlQuery,
      }),
    [agentId, conversationId, pageId, urlQueryKey, pathParamsKey, methods.streamFetch] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const chat = useChat({
    // Keyed by conversation, so a thread switch makes a new Chat that starts with its messages and
    // adopts the rebuilt transport; useChat stops the old one's reply.
    id: conversationId,
    messages: threads.initialMessages,
    transport,
    throttle: 50,
    sendAutomaticallyWhen: (args) =>
      lastAssistantMessageIsCompleteWithToolCalls(args) ||
      lastAssistantMessageIsCompleteWithApprovalResponses(args),
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic || toolCall.toolName !== 'update-page-state') return;
      pendingToolCallsRef.current.add(toolCall.toolCallId);
      try {
        const { output, writable } = getPageStateUpdates({
          sharedState: sharedStateRef.current,
          updates: toolCall.input?.updates,
        });
        if (Object.keys(writable).length > 0) {
          await methods.triggerEvent({ name: '__updatePageState', event: writable });
        }
        chatRef.current.addToolOutput({
          tool: 'update-page-state',
          toolCallId: toolCall.toolCallId,
          output,
        });
      } catch (error) {
        chatRef.current.addToolOutput({
          tool: 'update-page-state',
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: error.message,
        });
      } finally {
        pendingToolCallsRef.current.delete(toolCall.toolCallId);
      }
    },
    onError: (error) => {
      // A request that fails after the stream's start leaves an empty assistant shell, which
      // fails validation on every later send: drop it, so the person can simply try again.
      chatRef.current.setMessages((prev) =>
        prev.filter((message) => message.role !== 'assistant' || (message.parts?.length ?? 0) > 0)
      );
      methods.triggerEvent({ name: 'onError', event: { message: error.message } });
    },
    onFinish: (options) => {
      finishMetaRef.current = {
        finishReason: options.finishReason,
        isAbort: options.isAbort,
        isDisconnect: options.isDisconnect,
      };
      if (!options.isError) {
        threadsRef.current.onReplyFinished(options.messages);
      }
    },
    onData: (dataPart) => {
      methods.triggerEvent({
        name: 'onDataPart',
        event: { type: dataPart.type, data: dataPart.data, id: dataPart.id },
      });
    },
  });
  chatRef.current = chat;
  const { addToolApprovalResponse, clearError, error, messages, setMessages, status, stop } = chat;
  statusRef.current = status;
  messagesRef.current = messages;

  const isBusy = status === 'streaming' || status === 'submitted';
  const isLoading = loading === true || properties.loading === true || threads.resuming;
  const isEmpty = messages.length === 0;
  const { follow, following, onContentLayout, onTouchStart } = useFollowScroll();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fill, setFill] = useState(null);

  // An unanswered tool call left by a reply cut off this session fails validation for the whole
  // history. A reply still streaming is not cut off, and a client-side tool still running will
  // add its output.
  const withoutDeadToolCalls = useCallback((list) => {
    if (statusRef.current === 'streaming' || statusRef.current === 'submitted') return list;
    return replayableMessages({ messages: list, liveToolCallIds: pendingToolCallsRef.current });
  }, []);

  const deliver = useCallback(
    (message) => {
      chatRef.current.setMessages((prev) => withoutDeadToolCalls(prev));
      follow();
      chatRef.current.sendMessage(message);
    },
    [follow, withoutDeadToolCalls]
  );

  const regenerateReply = useCallback(
    (messageId) => {
      let kept = [];
      chatRef.current.setMessages((prev) => {
        kept = withoutDeadToolCalls(prev);
        return kept;
      });
      if (kept.length === 0) return;
      follow();
      chatRef.current.regenerate(kept.some((m) => m.id === messageId) ? { messageId } : undefined);
    },
    [follow, withoutDeadToolCalls]
  );

  // Sync app-kept messages (the web block's `messages`): undefined is "not given", null clears,
  // an array loads. Compared by count, last id and conversation, since operators rebuild arrays
  // on every render. Not read when the block keeps its own threads.
  const externalMessages = threads.managed ? undefined : properties.messages;
  const prevExternalRef = useRef({ count: 0, lastId: null, conversationId });
  useEffect(() => {
    if (type.isUndefined(externalMessages)) return;
    const list = externalMessages ?? [];
    const count = list.length;
    const lastId = count > 0 ? list[count - 1]?.id : null;
    const prev = prevExternalRef.current;
    if (count === prev.count && lastId === prev.lastId && conversationId === prev.conversationId) {
      return;
    }
    prevExternalRef.current = { count, lastId, conversationId };
    const replayable = withoutDeadToolCalls(list);
    externalIdsRef.current = collectExternalEventIds(replayable);
    setMessages(replayable);
  }, [conversationId, externalMessages, setMessages, withoutDeadToolCalls]);

  useAgentEvents({ conversationId, externalIdsRef, finishMetaRef, messages, methods, status });

  useEffect(() => {
    methods.registerEvent({
      name: '__updatePageState',
      actions: [{ id: 'setState', type: 'SetState', params: { _event: true } }],
    });
    methods.registerEvent({
      name: '__copy',
      actions: [{ id: 'copy', type: 'CopyToClipboard', params: { copy: { _event: 'text' } } }],
    });
    methods.registerEvent({
      name: '__link',
      actions: [{ id: 'link', type: 'Link', params: { url: { _event: 'href' } } }],
    });
  }, [methods]);

  const handleNewChat = useCallback(() => {
    chatRef.current.stop();
    setSheetOpen(false);
    threads.newThread();
    if (!threads.managed && !type.isNone(properties.conversationId)) {
      chatRef.current.setMessages([]);
    }
    follow();
  }, [follow, properties.conversationId, threads]);

  const openThreads = useCallback(() => {
    if (!threads.canList) return;
    setSheetOpen(true);
    threads.loadList();
  }, [threads]);

  // Registered on every render, so CallMethod always reaches the chat as it is now.
  useEffect(() => {
    methods.registerMethod('regenerate', (args) => {
      if (sendingRef.current) return;
      regenerateReply(args?.messageId);
    });
    methods.registerMethod('setMessages', (args) => {
      const list = withoutDeadToolCalls(args?.messages ?? []);
      externalIdsRef.current = collectExternalEventIds(list);
      setMessages(list);
    });
    methods.registerMethod('sendMessage', (args) => {
      if (type.isString(args?.text) && args.text !== '' && !sendingRef.current) {
        deliver({ text: args.text, ...(args.metadata ? { metadata: args.metadata } : {}) });
      }
    });
    methods.registerMethod('setInput', (args) => {
      setFill({ nonce: Date.now(), text: type.isString(args?.text) ? args.text : '' });
    });
    methods.registerMethod('clearMessages', () => setMessages([]));
    methods.registerMethod('deleteMessage', (args) => {
      if (type.isString(args?.messageId)) {
        setMessages((prev) => prev.filter((message) => message.id !== args.messageId));
      }
    });
    methods.registerMethod('stop', () => stop());
    methods.registerMethod('clearError', () => clearError());
    methods.registerMethod('scrollToBottom', () => follow());
    methods.registerMethod('openThreads', openThreads);
    methods.registerMethod('newChat', handleNewChat);
  });

  const handleSend = useCallback(
    async (text) => {
      if (sendingRef.current || isBusy || text.trim() === '') return false;
      sendingRef.current = true;
      try {
        const response = await methods.triggerEvent({
          name: 'onBeforeSend',
          event: { text, files: [], messages: messagesRef.current },
        });
        if (response.success === false) return false;
        deliver({ text });
        return true;
      } finally {
        sendingRef.current = false;
      }
    },
    [deliver, isBusy, methods]
  );

  const handleStop = useCallback(() => {
    stop();
    methods.triggerEvent({ name: 'onStop', event: { messages: messagesRef.current } });
  }, [methods, stop]);

  const copyText = useCallback(
    (text) => methods.triggerEvent({ name: '__copy', event: { text } }),
    [methods]
  );

  const onLinkPress = useCallback(
    (href) => {
      if (events.onLinkClick) {
        methods.triggerEvent({ name: 'onLinkClick', event: { href, text: '' } });
        return;
      }
      methods.triggerEvent({ name: '__link', event: { href } });
    },
    [events.onLinkClick, methods]
  );

  const actions = normalizeActions(config?.actions);
  const onAssistantLongPress = useCallback(
    (message) => {
      const items = [];
      if (actions.copy) items.push({ id: 'copy', title: translate('agent.message.copy') });
      if (
        actions.regenerate &&
        statusRef.current !== 'streaming' &&
        statusRef.current !== 'submitted'
      ) {
        items.push({ id: 'regenerate', title: translate('agent.message.regenerate') });
      }
      showMessageMenu({
        cancelTitle: translate('agent.chat.cancel'),
        items,
        onSelect: (item) => {
          if (item.id === 'copy') {
            copyText(getMessageText(message));
            return;
          }
          methods.triggerEvent({
            name: 'onRegenerate',
            event: { messageId: message.id, messages: messagesRef.current },
          });
          regenerateReply(message.id);
        },
      });
    },
    [actions.copy, actions.regenerate, copyText, methods, regenerateReply, translate]
  );

  const onUserLongPress = useCallback(
    (message) => {
      showMessageMenu({
        cancelTitle: translate('agent.chat.cancel'),
        items: [{ id: 'copy', title: translate('agent.message.copy') }],
        onSelect: () => copyText(getMessageText(message)),
      });
    },
    [copyText, translate]
  );

  const onApprove = useCallback(
    ({ approved, id }) => {
      follow();
      addToolApprovalResponse({ approved, id });
    },
    [addToolApprovalResponse, follow]
  );

  const lastMessage = messages[messages.length - 1];
  const showThinking =
    isBusy && (lastMessage?.role !== 'assistant' || !hasVisibleContent(lastMessage, config));
  const thinkingLabel = useThinkingMessage({
    active: showThinking,
    delay: config?.thinkingMessageDelay,
    interval: config?.thinkingMessageRotationInterval,
    messages: config?.thinkingMessages,
    resetKey: lastMessage?.id ?? 'none',
  });

  const agentSuggestions = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    const part = [...(lastAssistant?.parts ?? [])]
      .reverse()
      .find((p) => p.type === 'data-suggestions');
    return part?.data?.items ?? null;
  }, [messages]);
  let prompts = [];
  let onPrompt = (prompt) => deliver({ text: prompt.label });
  if (!isLoading && isEmpty) {
    prompts = toPrompts(properties.welcome?.prompts);
  } else if (!isLoading && !isBusy && type.isNone(error)) {
    prompts = toPrompts(agentSuggestions ?? properties.suggestions);
    onPrompt = (suggestion) => {
      methods.triggerEvent({ name: 'onSuggestionClick', event: { suggestion } });
      deliver({ text: suggestion.label });
    };
  }

  const composer = (
    <ChatComposer
      blockId={blockId}
      busy={isBusy}
      colors={colors}
      components={components}
      disabled={isLoading}
      fill={fill}
      newChat={sender.newChat !== false}
      onJumpToLatest={follow}
      onNewChat={handleNewChat}
      onPrompt={onPrompt}
      onSend={handleSend}
      onStop={handleStop}
      placeholder={
        type.isString(sender.placeholder)
          ? sender.placeholder
          : translate('agent.sender.placeholder')
      }
      prompts={prompts}
      showJump={!following && !isEmpty}
      style={
        sticky
          ? blockStyles.composer
          : [
              styles.inlineComposer,
              { backgroundColor: colors.cell, borderTopColor: colors.separator },
              blockStyles.composer,
            ]
      }
      translate={translate}
    />
  );
  useScreenFooter(sticky ? () => composer : null);

  let content;
  if (isLoading) {
    content = <ChatSkeleton testID={`${blockId}_loading`} />;
  } else if (isEmpty) {
    content = (
      <WelcomeView
        colors={colors}
        components={components}
        testID={`${blockId}_welcome`}
        welcome={properties.welcome}
      />
    );
  } else {
    content = messages.map((message) => {
      if (message.role === 'user') {
        return (
          <UserMessage
            colors={colors}
            key={message.id}
            message={message}
            onLongPress={onUserLongPress}
            testID={`${blockId}_message_${message.id}`}
          />
        );
      }
      return (
        <AssistantMessage
          colors={colors}
          components={components}
          config={config}
          isStreaming={isBusy && message === lastMessage}
          key={message.id}
          message={message}
          onApprove={onApprove}
          onLinkPress={onLinkPress}
          onLongPress={onAssistantLongPress}
          testID={`${blockId}_message_${message.id}`}
          translate={translate}
        />
      );
    });
  }

  return (
    <View
      onLayout={onContentLayout}
      onTouchStart={onTouchStart}
      style={[styles.root, blockStyles.element]}
      testID={blockId}
    >
      {content}
      {showThinking && !isLoading ? (
        <ThinkingIndicator colors={colors} label={thinkingLabel} testID={`${blockId}_thinking`} />
      ) : null}
      {!type.isNone(error) && !isBusy ? (
        <ChatError
          colors={colors}
          components={components}
          message={error.message}
          onRetry={
            isEmpty
              ? undefined
              : () => {
                  clearError();
                  regenerateReply();
                }
          }
          testID={`${blockId}_error`}
          translate={translate}
        />
      ) : null}
      {threads.canList ? (
        <ThreadsSheet
          activeId={conversationId}
          blockId={blockId}
          canDelete={threads.canDelete}
          colors={colors}
          components={components}
          isDark={isDark}
          list={threads.list}
          onClose={() => setSheetOpen(false)}
          onDelete={(item) => threads.deleteThread(item.key)}
          onNewChat={handleNewChat}
          onOpen={async (item) => {
            if (await threads.openThread(item)) setSheetOpen(false);
          }}
          open={sheetOpen}
          openingId={threads.openingId}
          title={
            type.isString(properties.threads?.title)
              ? properties.threads.title
              : translate('agent.chat.chats')
          }
          tokens={tokens}
          translate={translate}
        />
      ) : null}
      {sticky ? null : composer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 20, paddingBottom: 16, paddingHorizontal: 16, paddingTop: 12 },
  inlineComposer: { borderTopWidth: StyleSheet.hairlineWidth, marginHorizontal: -16 },
});

AgentChat.meta = meta;

export default AgentChat;
