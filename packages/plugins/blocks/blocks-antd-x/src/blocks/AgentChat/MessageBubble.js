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
import Markdown from '@ant-design/x-markdown';
import {
  Actions,
  CodeHighlighter,
  FileCard,
  Mermaid,
  Sources,
  ThoughtChain,
  Think,
} from '@ant-design/x';
import { DeleteOutlined, ReloadOutlined, RobotOutlined } from '@ant-design/icons';

import DynamicBlock from './DynamicBlock.js';
import { getFileCardType, getFileCardIcon, getFileName } from './fileCardUtils.js';
import formatToolResult from './formatToolResult.js';
import ToolApproval from './ToolApproval.js';

// Module-level singleton for the LaTeX marked extension.
// Loaded once on first use — the Latex plugin from @ant-design/x-markdown
// includes KaTeX CSS import and handles $...$ inline and $$...$$ display math.
let latexConfig = null;
function getLatexConfig() {
  if (latexConfig) return latexConfig;
  try {
    // eslint-disable-next-line global-require
    const Latex = require('@ant-design/x-markdown/plugins/Latex').default;
    latexConfig = { extensions: Latex() };
  } catch {
    latexConfig = {};
  }
  return latexConfig;
}

// Renders a code block as plain text without syntax highlighting or mermaid rendering.
function PlainCodeBlock({ children, block, lang }) {
  if (!block) {
    return <code>{children}</code>;
  }
  return (
    <pre>
      <code className={lang ? `language-${lang}` : undefined}>{children}</code>
    </pre>
  );
}

// Renders code blocks with syntax highlighting via CodeHighlighter and
// mermaid diagrams via the Mermaid component from @ant-design/x.
function RichCodeBlock({ renderMermaid, codeHighlighter }) {
  return function CodeBlock({ children, block, lang }) {
    if (!block) {
      return <code>{children}</code>;
    }
    if (renderMermaid && lang === 'mermaid') {
      return (
        <div style={{ width: '100%' }}>
          <Mermaid>{children}</Mermaid>
        </div>
      );
    }
    if (codeHighlighter) {
      return (
        <CodeHighlighter lang={lang} prismLightMode={false}>
          {children}
        </CodeHighlighter>
      );
    }
    return (
      <pre>
        <code className={lang ? `language-${lang}` : undefined}>{children}</code>
      </pre>
    );
  };
}

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
  if (Array.isArray(output))
    return `Returned ${output.length} result${output.length === 1 ? '' : 's'}`;
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

function resolveToolResultMode(toolResultDisplay, toolName) {
  if (typeof toolResultDisplay === 'string') return toolResultDisplay;
  if (typeof toolResultDisplay === 'object') {
    return toolResultDisplay[toolName] ?? toolResultDisplay.default ?? 'readable';
  }
  return 'summary';
}

function normalizeActions(actions) {
  if (Array.isArray(actions)) {
    const obj = {};
    for (const action of actions) {
      obj[action] = true;
    }
    return obj;
  }
  return actions ?? {};
}

function BubbleActions({ actions, textContent, messageId, onFeedback, onRegenerate, onDelete }) {
  const normalized = normalizeActions(actions);
  const items = [];

  if (normalized.copy) {
    items.push({
      key: 'copy',
      label: 'Copy',
      actionRender: () => <Actions.Copy text={textContent} />,
    });
  }
  if (normalized.feedback) {
    items.push({
      key: 'feedback',
      label: 'Feedback',
      actionRender: () => (
        <Actions.Feedback onChange={(rating) => onFeedback?.({ messageId, rating })} />
      ),
    });
  }
  if (normalized.regenerate) {
    items.push({
      key: 'regenerate',
      icon: <ReloadOutlined />,
      label: 'Regenerate',
      onItemClick: () => onRegenerate?.({ messageId }),
    });
  }
  if (normalized.delete) {
    items.push({
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onItemClick: () => onDelete?.({ messageId }),
    });
  }

  if (items.length === 0) return null;
  return <Actions items={items} />;
}

function SourcesDisplay({ sourceParts, config }) {
  if (sourceParts.length === 0) return null;
  const items = sourceParts.map((source, i) => ({
    key: `source-${i}`,
    title: source.title ?? source.url ?? `Source ${i + 1}`,
    url: source.url,
    description: source.url,
  }));
  return (
    <Sources
      items={items}
      title="Sources"
      inline={config?.sourcesDisplay?.inline ?? false}
      expandIconPosition={config?.sourcesDisplay?.expandIconPosition ?? 'end'}
    />
  );
}

function MessageBubble({
  content,
  isStreaming,
  parts,
  config,
  addToolApprovalResponse,
  actions,
  messageId,
  onFeedback,
  onRegenerate,
  onDelete,
  blockComponents,
}) {
  const showThoughtChain = config?.showThoughtChain !== false;
  const showReasoning = config?.showReasoning !== false;
  const reasoningDisplay = config?.reasoningDisplay ?? 'interleaved';
  const toolResultDisplay = config?.toolResultDisplay ?? 'summary';
  const renderMermaid = config?.renderMermaid !== false;
  const codeHighlighter = config?.codeHighlighter !== false;
  const renderLatex = config?.renderLatex ?? false;
  const markdownConfig = renderLatex ? getLatexConfig() : undefined;

  const markdownComponents = useMemo(() => {
    if (!renderMermaid && !codeHighlighter) return { code: PlainCodeBlock };
    return { code: RichCodeBlock({ renderMermaid, codeHighlighter }) };
  }, [renderMermaid, codeHighlighter]);

  const normalizedActions = normalizeActions(actions);
  const showActions = Object.values(normalizedActions).some(Boolean) && !isStreaming;

  const showSources = config?.showSources;
  const sourceParts = showSources
    ? (parts ?? []).filter((p) => p.type === 'source-url' || p.type === 'source-document')
    : [];

  if (!parts || parts.length === 0) {
    return (
      <div>
        <Markdown
          streaming={isStreaming ? { hasNextChunk: true } : undefined}
          components={markdownComponents}
          config={markdownConfig}
        >
          {content}
        </Markdown>
        <SourcesDisplay sourceParts={sourceParts} config={config} />
        {showActions && (
          <BubbleActions
            actions={normalizedActions}
            textContent={content}
            messageId={messageId}
            onFeedback={onFeedback}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
          />
        )}
      </div>
    );
  }

  // OpenAI Responses API models (e.g. GPT-5.x) emit text parts with a 'commentary'
  // phase (preambles before tool calls) and a 'final_answer' phase (the actual response).
  // Commentary is intermediate output — treat it as reasoning so it renders in the
  // collapsible reasoning section rather than duplicating the final answer text.
  function isCommentary(part) {
    return part.providerMetadata?.openai?.phase === 'commentary';
  }

  function partCategory(part) {
    if (part.type === 'step-start') return null;
    if (part.type === 'data-display') return 'display';
    if (part.type === 'reasoning' || (part.type === 'text' && isCommentary(part))) {
      return 'reasoning';
    }
    if (part.type === 'text') return 'text';
    if (getToolInfo(part)) return 'tool';
    if (part.type === 'file') return 'file';
    if (part.type === 'data-status') return 'status';
    return null;
  }

  // Build segments of consecutive same-type parts.
  // 'interleaved': preserves the natural ordering from the AI SDK
  //   (reasoning → tool calls → reasoning → text).
  // 'grouped': collects all parts by type into three fixed buckets
  //   (all reasoning → all tools → all text), matching the original rendering.
  let segments;

  if (reasoningDisplay === 'grouped') {
    const reasoning = { category: 'reasoning', parts: [] };
    const tools = { category: 'tool', parts: [] };
    const display = { category: 'display', parts: [] };
    const files = { category: 'file', parts: [] };
    const status = { category: 'status', parts: [] };
    const text = { category: 'text', parts: [] };
    for (const part of parts) {
      const cat = partCategory(part);
      if (cat === 'reasoning') reasoning.parts.push(part);
      else if (cat === 'text') text.parts.push(part);
      else if (cat === 'tool') tools.parts.push(part);
      else if (cat === 'display') display.parts.push(part);
      else if (cat === 'file') files.parts.push(part);
      else if (cat === 'status') status.parts.push(part);
    }
    segments = [reasoning, tools, display, files, status, text].filter(
      (s) => s.parts.length > 0
    );
  } else {
    segments = [];
    let current = null;
    for (const part of parts) {
      const category = partCategory(part);
      if (!category) continue;

      if (!current || current.category !== category) {
        current = { category, parts: [] };
        segments.push(current);
      }
      current.parts.push(part);
    }
  }

  const lastTextIdx = segments.findLastIndex((s) => s.category === 'text');

  const allTextContent = parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {segments.map((segment, idx) => {
        if (segment.category === 'reasoning' && showReasoning) {
          const text = segment.parts.map((p) => p.text).join('');
          if (text.length === 0 && !isStreaming) return null;
          const isActiveReasoning =
            isStreaming && segment.parts.some((p) => p.state === 'streaming');
          return (
            <Think
              key={`reasoning-${idx}`}
              title="Reasoning"
              defaultExpanded={false}
              loading={isActiveReasoning}
              blink={isActiveReasoning}
            >
              {text}
            </Think>
          );
        }
        if (segment.category === 'tool' && showThoughtChain) {
          const items = segment.parts.map((part) => {
            const tool = getToolInfo(part);

            if (tool.state === 'output-denied') {
              return {
                key: tool.toolCallId,
                title: tool.toolName,
                description: 'Tool execution was rejected',
                status: 'error',
              };
            }

            if (tool.state === 'approval-requested' && part.approval?.id) {
              return {
                key: tool.toolCallId,
                title: tool.toolName,
                description: (
                  <ToolApproval
                    toolName={tool.toolName}
                    input={tool.input}
                    approvalId={part.approval.id}
                    onApprove={(id) => addToolApprovalResponse?.({ id, approved: true })}
                    onReject={(id) => addToolApprovalResponse?.({ id, approved: false })}
                  />
                ),
                status: 'loading',
              };
            }

            let status = 'loading';
            if (tool.state === 'output-available') {
              status = 'success';
            } else if (tool.state === 'output-error') {
              status = 'error';
            }

            // Detect sub-agent results
            const isSubAgent = tool.output?._subAgent === true;
            const toolOutput = isSubAgent ? tool.output.text : tool.output;

            let description;
            let content;
            let collapsible = false;
            if (status === 'loading') {
              const showInput = config?.showToolInputStreaming !== false;
              if (showInput && tool.input && Object.keys(tool.input).length > 0) {
                description = `Input: ${JSON.stringify(tool.input, null, 2)}`;
              } else {
                description = 'Running...';
              }
            } else if (status === 'error') {
              description = 'Tool execution failed';
            } else if (toolOutput?.display && typeof toolOutput.display === 'string') {
              description = summarizeToolOutput(toolOutput.display);
              content = (
                <Markdown components={markdownComponents} config={markdownConfig}>
                  {toolOutput.display}
                </Markdown>
              );
              collapsible = true;
            } else if (isSubAgent) {
              // Sub-agent results: short status in description, full response in styled content
              description = 'Completed';
              const subAgentText =
                typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput, null, 2);
              content = (
                <div
                  style={{
                    fontSize: '0.85em',
                    color: 'rgba(0, 0, 0, 0.65)',
                    borderLeft: '2px solid #d9d9d9',
                    paddingLeft: 12,
                  }}
                >
                  <Markdown components={markdownComponents} config={markdownConfig}>
                    {subAgentText}
                  </Markdown>
                </div>
              );
              collapsible = true;
            } else {
              const mode = resolveToolResultMode(toolResultDisplay, tool.toolName);
              if (mode === 'readable') {
                description = summarizeToolOutput(toolOutput);
                content = formatToolResult(toolOutput);
                collapsible = true;
              } else if (mode === 'full') {
                description = summarizeToolOutput(toolOutput);
                content = JSON.stringify(toolOutput, null, 2);
                collapsible = true;
              } else if (mode === 'none') {
                description = 'Completed';
              } else {
                // summary mode: show summary, add readable content behind collapse
                description = summarizeToolOutput(toolOutput);
                const readable = formatToolResult(toolOutput);
                if (readable != null) {
                  content = readable;
                  collapsible = true;
                }
              }
            }
            return {
              key: tool.toolCallId,
              title: tool.toolName,
              description,
              ...(content != null ? { content } : {}),
              ...(collapsible ? { collapsible: true } : {}),
              ...(isSubAgent ? { icon: <RobotOutlined /> } : {}),
              ...(status === 'loading' ? { blink: true } : {}),
              status,
            };
          });
          return <ThoughtChain key={`tool-${idx}`} items={items} />;
        }
        if (segment.category === 'file') {
          const fileItems = segment.parts.map((part, i) => {
            const cardType = getFileCardType(part.mediaType);
            return {
              key: `file-${idx}-${i}`,
              name: getFileName(part),
              type: cardType,
              icon: getFileCardIcon(part.mediaType, part.filename),
              src:
                cardType === 'image' || cardType === 'video' || cardType === 'audio'
                  ? part.url
                  : undefined,
            };
          });
          if (fileItems.length === 1) {
            return <FileCard key={`file-${idx}`} {...fileItems[0]} />;
          }
          return <FileCard.List key={`file-${idx}`} items={fileItems} overflow="wrap" />;
        }
        if (segment.category === 'status') {
          const lastStatus = segment.parts[segment.parts.length - 1];
          if (!isStreaming || config?.showStatusUpdates === false) return null;
          return (
            <div
              key={`status-${idx}`}
              style={{
                color: '#8c8c8c',
                fontSize: '0.85em',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                ⟳
              </span>
              {lastStatus.data?.message ?? 'Processing...'}
            </div>
          );
        }
        if (segment.category === 'display') {
          return segment.parts.map((part) => (
            <DynamicBlock
              key={part.id ?? `display-${idx}`}
              config={part.data.display}
              output={part.data.output}
              input={part.data.input}
              toolCallId={part.data.toolCallId}
              blockComponents={blockComponents}
            />
          ));
        }
        if (segment.category === 'text') {
          const text = segment.parts.map((p) => p.text).join('');
          if (text.length === 0) return null;
          const isLastText = idx === lastTextIdx;
          return (
            <Markdown
              key={`text-${idx}`}
              streaming={isStreaming && isLastText ? { hasNextChunk: true } : undefined}
              components={markdownComponents}
              config={markdownConfig}
            >
              {text}
            </Markdown>
          );
        }
        return null;
      })}
      <SourcesDisplay sourceParts={sourceParts} config={config} />
      {showActions && (
        <BubbleActions
          actions={normalizedActions}
          textContent={allTextContent}
          messageId={messageId}
          onFeedback={onFeedback}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

export default MessageBubble;
