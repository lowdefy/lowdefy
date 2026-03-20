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

import { useRef, useEffect } from 'react';

function useAgentEvents({ messages, status, methods }) {
  const prevStatusRef = useRef(status);
  const firedToolCallIds = useRef(new Set());
  const firedToolResultIds = useRef(new Set());
  const lastMessageCountRef = useRef(0);

  // Fire onMessageComplete when streaming finishes
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'idle') {
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant');
      if (lastAssistantMessage) {
        const textContent = lastAssistantMessage.parts
          ?.filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('');
        methods.triggerEvent({
          name: 'onMessageComplete',
          event: {
            role: lastAssistantMessage.role,
            content: textContent,
            messageId: lastAssistantMessage.id,
          },
        });
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, methods]);

  // Scan for new tool calls and results
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts ?? []) {
        if (part.type?.startsWith?.('tool-') || part.type === 'dynamic-tool') {
          const toolCallId = part.toolCallId;
          if (!toolCallId) continue;

          if (!firedToolCallIds.current.has(toolCallId)) {
            firedToolCallIds.current.add(toolCallId);
            methods.triggerEvent({
              name: 'onToolCall',
              event: {
                toolName: part.toolName ?? part.type?.replace('tool-', ''),
                toolCallId,
                input: part.input,
              },
            });
          }

          if (
            part.state === 'output-available' &&
            !firedToolResultIds.current.has(toolCallId)
          ) {
            firedToolResultIds.current.add(toolCallId);
            methods.triggerEvent({
              name: 'onToolResult',
              event: {
                toolName: part.toolName ?? part.type?.replace('tool-', ''),
                toolCallId,
                output: part.output,
              },
            });
          }
        }
      }
    }
  }, [messages, methods]);

  // Reset tracking when messages are cleared (conversation switch)
  useEffect(() => {
    if (messages.length < lastMessageCountRef.current) {
      firedToolCallIds.current.clear();
      firedToolResultIds.current.clear();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);
}

export default useAgentEvents;
