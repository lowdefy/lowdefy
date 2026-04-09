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

function useAgentEvents({ messages, status, methods, finishMetaRef }) {
  const prevStatusRef = useRef(status);
  const firedToolCallIds = useRef(new Set());
  const firedToolResultIds = useRef(new Set());
  const firedUserMessageIds = useRef(new Set());
  const lastMessageCountRef = useRef(0);

  // Fire onMessageComplete when streaming finishes
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'idle') {
      const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistantMessage) {
        const textContent = lastAssistantMessage.parts
          ?.filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('');
        const finishMeta = finishMetaRef?.current ?? {};
        methods.triggerEvent({
          name: 'onMessageComplete',
          event: {
            role: lastAssistantMessage.role,
            content: textContent,
            messageId: lastAssistantMessage.id,
            parts: lastAssistantMessage.parts,
            finishReason: finishMeta.finishReason,
            isAbort: finishMeta.isAbort ?? false,
            isDisconnect: finishMeta.isDisconnect ?? false,
            messages: messages.map((m) => ({
              id: m.id,
              role: m.role,
              parts: m.parts,
            })),
          },
        });
        finishMetaRef.current = null;
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, methods]);

  // Fire onUserMessage when a new user message appears
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === 'user' &&
      !firedUserMessageIds.current.has(lastMessage.id)
    ) {
      firedUserMessageIds.current.add(lastMessage.id);
      const textContent = lastMessage.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
      methods.triggerEvent({
        name: 'onUserMessage',
        event: {
          role: 'user',
          messageId: lastMessage.id,
          content: textContent,
          parts: lastMessage.parts,
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
          })),
        },
      });
    }
  }, [messages, methods]);

  // Scan for new tool calls and results
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts ?? []) {
        if (part.type?.startsWith?.('tool-') || part.type === 'dynamic-tool') {
          const toolCallId = part.toolCallId;
          if (!toolCallId) continue;

          const toolName = part.toolName ?? part.type?.replace('tool-', '');

          if (!firedToolCallIds.current.has(toolCallId)) {
            firedToolCallIds.current.add(toolCallId);
            methods.triggerEvent({
              name: 'onToolCall',
              event: {
                toolName,
                toolCallId,
                input: part.input,
              },
            });
          }

          if (
            (part.state === 'output-available' || part.state === 'output-error') &&
            !firedToolResultIds.current.has(toolCallId)
          ) {
            firedToolResultIds.current.add(toolCallId);
            methods.triggerEvent({
              name: 'onToolResult',
              event: {
                toolName,
                toolCallId,
                output: part.output,
                error: part.state === 'output-error',
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
      firedUserMessageIds.current.clear();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);
}

export default useAgentEvents;
