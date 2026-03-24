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

import React, { useRef, useMemo, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Sender } from '@ant-design/x';
import { type } from '@lowdefy/helpers';

import ConversationSidebar from './ConversationSidebar.js';
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
  } = properties;
  const senderRef = useRef(null);
  const toolConfirmModesRef = useRef({});

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

  const {
    messages,
    sendMessage,
    status,
    stop,
    addToolApprovalResponse,
    setMessages,
  } = useChat({
    transport,
    experimental_throttle: 50,
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
        addToolApprovalResponse({ toolCallId: approvalId, approve: true });
      }
    });
    methods.registerMethod('rejectTool', ({ approvalId }) => {
      if (approvalId && addToolApprovalResponse) {
        addToolApprovalResponse({ toolCallId: approvalId, approve: false });
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
  const showSidebar = conversationsConfig?.enabled;

  function handleConversationChange(key, previousKey) {
    methods.triggerEvent({
      name: 'onConversationChange',
      event: { key, previousKey },
    });
  }

  function handleNewConversation() {
    methods.triggerEvent({ name: 'onNewConversation', event: {} });
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
      {showSidebar && (
        <ConversationSidebar
          config={conversationsConfig}
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
