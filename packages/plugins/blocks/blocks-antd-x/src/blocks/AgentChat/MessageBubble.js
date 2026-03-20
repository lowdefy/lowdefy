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

import React from 'react';
import Markdown from '@ant-design/x-markdown';
import { ThoughtChain, Think } from '@ant-design/x';

// Detects tool-call parts from AI SDK v6's dynamic part types.
// Tool parts have type `tool-${toolName}` or `dynamic-tool`, not a generic `tool-invocation`.
function getToolInfo(part) {
  if (!part.type?.startsWith?.('tool-') && part.type !== 'dynamic-tool') return null;
  return {
    toolCallId: part.toolCallId,
    toolName: part.toolName ?? part.type?.replace('tool-', ''),
    state: part.state,
    input: part.input,
    output: part.output,
  };
}

function summarizeToolOutput(output) {
  if (output === null || output === undefined) return 'Completed (no data)';
  if (Array.isArray(output)) return `Returned ${output.length} result${output.length === 1 ? '' : 's'}`;
  if (typeof output === 'object') {
    const keys = Object.keys(output);
    if (keys.length <= 3) return `Returned: ${keys.join(', ')}`;
    return `Returned object with ${keys.length} fields`;
  }
  if (typeof output === 'string') {
    return output.length > 80 ? `${output.substring(0, 80)}...` : output;
  }
  return String(output);
}

function MessageBubble({ content, isStreaming, parts, config }) {
  const showThoughtChain = config?.showThoughtChain !== false;
  const showReasoning = config?.showReasoning !== false;
  const toolResultDisplay = config?.toolResultDisplay ?? 'summary';

  if (!parts || parts.length === 0) {
    return (
      <Markdown
        streaming={isStreaming ? { hasNextChunk: true } : undefined}
      >
        {content}
      </Markdown>
    );
  }

  const toolItems = [];
  const textParts = [];
  const reasoningParts = [];

  for (const part of parts) {
    if (part.type === 'text') {
      textParts.push(part.text);
    } else if (part.type === 'reasoning') {
      reasoningParts.push(part.text);
    } else {
      const tool = getToolInfo(part);
      if (tool) {
        let status = 'loading';
        if (tool.state === 'output-available') {
          status = 'success';
        } else if (tool.state === 'output-error') {
          status = 'error';
        }
        let description;
        if (status === 'loading') {
          description = tool.input
            ? `Called with: ${JSON.stringify(tool.input)}`
            : 'Running...';
        } else if (status === 'error') {
          description = 'Tool execution failed';
        } else if (toolResultDisplay === 'full') {
          description = JSON.stringify(tool.output, null, 2);
        } else {
          description = summarizeToolOutput(tool.output);
        }
        toolItems.push({
          key: tool.toolCallId,
          title: tool.toolName,
          description,
          status,
        });
      }
    }
  }

  const reasoningText = reasoningParts.join('');

  return (
    <div>
      {showReasoning && reasoningText.length > 0 && (
        <Think title="Reasoning" defaultExpanded={false}>
          {reasoningText}
        </Think>
      )}
      {showThoughtChain && toolItems.length > 0 && (
        <ThoughtChain items={toolItems} />
      )}
      {textParts.length > 0 && (
        <Markdown
          streaming={isStreaming ? { hasNextChunk: true } : undefined}
        >
          {textParts.join('')}
        </Markdown>
      )}
    </div>
  );
}

export default MessageBubble;
