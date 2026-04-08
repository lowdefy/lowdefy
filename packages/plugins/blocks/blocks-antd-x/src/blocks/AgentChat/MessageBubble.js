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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from '@ant-design/x-markdown';
import { Actions, CodeHighlighter, Mermaid, Sources, ThoughtChain, Think } from '@ant-design/x';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';

import ToolApproval from './ToolApproval.js';

// Module-level singleton so all MessageBubble instances share the same loaded plugins.
let latexPlugins = null;
async function getLatexPlugins() {
  if (latexPlugins) return latexPlugins;
  const [remarkMath, rehypeKatex] = await Promise.all([
    import('remark-math'),
    import('rehype-katex'),
  ]);
  latexPlugins = {
    remarkPlugins: [remarkMath.default],
    rehypePlugins: [rehypeKatex.default],
  };
  return latexPlugins;
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
        <Actions.Feedback
          onChange={(value) =>
            onFeedback?.({ messageId, rating: value === 'like' ? 'positive' : 'negative' })
          }
        />
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
}) {
  const showThoughtChain = config?.showThoughtChain !== false;
  const showReasoning = config?.showReasoning !== false;
  const reasoningDisplay = config?.reasoningDisplay ?? 'interleaved';
  const toolResultDisplay = config?.toolResultDisplay ?? 'summary';
  const renderMermaid = config?.renderMermaid !== false;
  const codeHighlighter = config?.codeHighlighter !== false;
  const renderLatex = config?.renderLatex ?? false;

  const latexPluginsRef = useRef(null);
  const [latexReady, setLatexReady] = useState(!renderLatex);

  useEffect(() => {
    if (renderLatex && !latexPluginsRef.current) {
      getLatexPlugins().then((plugins) => {
        latexPluginsRef.current = plugins;
        setLatexReady(true);
      });
    }
  }, [renderLatex]);

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
          remarkPlugins={latexPluginsRef.current?.remarkPlugins}
          rehypePlugins={latexPluginsRef.current?.rehypePlugins}
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

  // Build segments of consecutive same-type parts.
  // 'interleaved': preserves the natural ordering from the AI SDK
  //   (reasoning → tool calls → reasoning → text).
  // 'grouped': collects all parts by type into three fixed buckets
  //   (all reasoning → all tools → all text), matching the original rendering.
  let segments;

  if (reasoningDisplay === 'grouped') {
    const reasoning = { category: 'reasoning', parts: [] };
    const tools = { category: 'tool', parts: [] };
    const text = { category: 'text', parts: [] };
    for (const part of parts) {
      if (part.type === 'reasoning') reasoning.parts.push(part);
      else if (part.type === 'text') text.parts.push(part);
      else if (getToolInfo(part)) tools.parts.push(part);
    }
    segments = [reasoning, tools, text].filter((s) => s.parts.length > 0);
  } else {
    segments = [];
    let current = null;
    for (const part of parts) {
      if (part.type === 'step-start') continue;

      let category;
      if (part.type === 'text') {
        category = 'text';
      } else if (part.type === 'reasoning') {
        category = 'reasoning';
      } else if (getToolInfo(part)) {
        category = 'tool';
      } else {
        continue;
      }

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
    <div>
      {segments.map((segment, idx) => {
        if (segment.category === 'reasoning' && showReasoning) {
          const text = segment.parts.map((p) => p.text).join('');
          if (text.length === 0 && !isStreaming) return null;
          const isActiveReasoning = isStreaming && segment.parts.some((p) => p.state === 'streaming');
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
            return {
              key: tool.toolCallId,
              title: tool.toolName,
              description,
              status,
            };
          });
          return <ThoughtChain key={`tool-${idx}`} items={items} />;
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
              remarkPlugins={latexPluginsRef.current?.remarkPlugins}
              rehypePlugins={latexPluginsRef.current?.rehypePlugins}
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
