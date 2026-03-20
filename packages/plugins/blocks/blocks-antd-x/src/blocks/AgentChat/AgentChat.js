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

import React, { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { Sender } from '@ant-design/x';

import LowdefyChatTransport from './LowdefyChatTransport.js';
import MessageList from './MessageList.js';
import WelcomeScreen from './WelcomeScreen.js';

function AgentChat({ blockId, methods, pageId, properties }) {
  const { agentId, welcome, messages: messagesConfig, sender } = properties;

  const transport = useMemo(
    () => new LowdefyChatTransport({ pageId, agentId }),
    [pageId, agentId]
  );

  const { messages, sendMessage, status, stop } = useChat({
    transport,
    experimental_throttle: 50,
  });

  // useAgentEvents hook will be added in Task 10

  const isEmpty = messages.length === 0;
  const isStreaming = status === 'streaming';

  function handleSend(text) {
    if (!text.trim()) return;
    sendMessage({ text });
  }

  function handlePromptClick(prompt) {
    sendMessage({ text: prompt.label });
  }

  return (
    <div
      id={blockId}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {isEmpty ? (
          <WelcomeScreen config={welcome} onPromptClick={handlePromptClick} />
        ) : (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            config={messagesConfig}
          />
        )}
      </div>
      <Sender
        placeholder={sender?.placeholder ?? 'Type a message...'}
        onSubmit={handleSend}
        onCancel={stop}
        loading={isStreaming}
      />
    </div>
  );
}

AgentChat.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default AgentChat;
