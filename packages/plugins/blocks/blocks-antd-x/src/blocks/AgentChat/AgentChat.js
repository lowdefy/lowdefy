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
import { Sender } from '@ant-design/x';
import { type } from '@lowdefy/helpers';

import ConversationSidebar from './ConversationSidebar.js';
import LowdefyChatTransport from './LowdefyChatTransport.js';
import MessageList from './MessageList.js';
import useAgentEvents from './useAgentEvents.js';
import WelcomeScreen from './WelcomeScreen.js';

let conversationCounter = 0;

function createConversation(label) {
  conversationCounter += 1;
  const key = `conv_${Date.now()}_${conversationCounter}`;
  return { key, label: label ?? `Chat ${conversationCounter}` };
}

function AgentChat({ blockId, methods, pageId, properties }) {
  const {
    agentId,
    welcome,
    messageDisplay,
    sender,
    conversations: conversationsConfig,
    messages: externalMessages,
  } = properties;
  const senderRef = useRef(null);
  const toolConfirmModesRef = useRef({});

  // --- Conversation state (managed internally when conversations.enabled) ---
  const conversationsEnabled = conversationsConfig?.enabled;
  const conversationMapRef = useRef(new Map());
  const [conversationItems, setConversationItems] = useState(() => {
    if (!conversationsEnabled) return [];
    const first = createConversation();
    return [first];
  });
  const [activeConversationKey, setActiveConversationKey] = useState(
    () => conversationItems[0]?.key ?? null
  );

  const transport = useMemo(
    () =>
      new LowdefyChatTransport({
        pageId,
        agentId,
        onToolConfirmModes: (modes) => {
          toolConfirmModesRef.current = modes;
        },
      }),
    [pageId, agentId]
  );

  const { messages, sendMessage, status, stop, addToolApprovalResponse, setMessages } = useChat({
    transport,
    experimental_throttle: 50,
    // Auto-resubmit to the server after tool approvals are responded to.
    // Without this, addToolApprovalResponse only updates local state.
    sendAutomaticallyWhen({ messages: msgs }) {
      const lastMessage = msgs[msgs.length - 1];
      if (lastMessage?.role !== 'assistant') return false;
      return lastMessage.parts.some(
        (part) => part.state === 'approval-responded' && part.approval?.approved !== undefined
      );
    },
    onError: (error) => {
      methods.triggerEvent({
        name: 'onError',
        event: { message: error.message },
      });
    },
  });

  useEffect(() => {
    methods.registerMethod('confirmTool', ({ approvalId }) => {
      if (approvalId && addToolApprovalResponse) {
        addToolApprovalResponse({ id: approvalId, approved: true });
      }
    });
    methods.registerMethod('rejectTool', ({ approvalId, reason }) => {
      if (approvalId && addToolApprovalResponse) {
        addToolApprovalResponse({ id: approvalId, approved: false, reason });
      }
    });
  }, [methods, addToolApprovalResponse]);

  // Sync external messages when provided — undefined means "not provided" (no sync),
  // null means "clear messages", array means "load these messages".
  useEffect(() => {
    if (!type.isUndefined(externalMessages)) {
      setMessages(externalMessages ?? []);
    }
  }, [externalMessages, setMessages]);

  useAgentEvents({ messages, status, methods, toolConfirmModes: toolConfirmModesRef });

  const isEmpty = messages.length === 0;
  const isStreaming = status === 'streaming';

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

  function handleSend(text) {
    if (!text.trim()) return;
    sendMessage({ text });
    senderRef.current?.clear();
  }

  function handlePromptClick(prompt) {
    sendMessage({ text: prompt.label });
  }

  return (
    <div
      id={blockId}
      style={{
        display: 'flex',
        height: properties.height ?? 'calc(100dvh - 170px)',
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
              isStreaming={isStreaming}
              config={messageDisplay}
              toolConfirmModes={toolConfirmModesRef}
              addToolApprovalResponse={addToolApprovalResponse}
            />
          )}
        </div>
        <div style={{ padding: '8px 0 16px' }}>
          <Sender
            ref={senderRef}
            placeholder={sender?.placeholder ?? 'Type a message...'}
            onSubmit={handleSend}
            onCancel={stop}
            loading={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}

AgentChat.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default AgentChat;
