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

// Detects tool-call parts from AI SDK v6's dynamic part types.
// Tool parts have type `tool-${toolName}` or `dynamic-tool`, not a generic `tool-invocation`.
export function getToolInfo(part) {
  if (!part.type?.startsWith?.('tool-') && part.type !== 'dynamic-tool') return null;
  return {
    toolCallId: part.toolCallId,
    toolName: part.toolName ?? part.type?.replace('tool-', ''),
    state: part.state,
    input: part.input,
    output: part.output,
  };
}

// OpenAI Responses API models (e.g. GPT-5.x) emit text parts with a 'commentary'
// phase (preambles before tool calls) and a 'final_answer' phase (the actual response).
// Commentary is intermediate output — treat it as reasoning so it renders in the
// collapsible reasoning section rather than duplicating the final answer text.
export function isCommentaryPart(part) {
  return part.providerMetadata?.openai?.phase === 'commentary';
}

// Classify a message part for inline rendering in MessageBubble's segment loop.
// Returns 'reasoning' | 'text' | 'tool' | 'file' | 'status' | null.
// Parts that return null are either never-rendered (e.g. step-start) or rendered
// via separate paths (source-url/source-document via SourcesDisplay, custom data-*
// parts not handled inline). MessageBubble's interleaved loop skips null categories
// so they don't fragment consecutive same-type segments.
export function partCategory(part) {
  if (part.type === 'step-start') return null;
  if (part.type === 'reasoning' || (part.type === 'text' && isCommentaryPart(part))) {
    return 'reasoning';
  }
  if (part.type === 'text') return 'text';
  if (getToolInfo(part)) return 'tool';
  if (part.type === 'file') return 'file';
  if (part.type === 'data-status') return 'status';
  return null;
}

// Returns true if `part` produces visible UI given the current messageDisplay config.
// Covers both inline rendering (mirrors partCategory + config) and out-of-segment
// paths (SourcesDisplay for source-url/source-document). Unknown part types default
// to visible — fail-safe so dots don't flash on top of something we can't classify
// but the bubble may actually be rendering (future SDK additions, custom data-*).
export function isPartVisible(part, config) {
  if (part.type === 'step-start') return false;
  const category = partCategory(part);
  if (category === 'text') return (part.text ?? '').length > 0;
  if (category === 'reasoning') {
    if (config?.showReasoning === false) return false;
    // Commentary-phase text parts are bucketed as 'reasoning' but still need the
    // same empty-text guard: the AI SDK pushes text parts with text='' on text-start
    // before any text-delta chunks arrive, so an empty commentary part shouldn't
    // count as visible content — dots should keep showing until real text streams.
    if (part.type === 'text') return (part.text ?? '').length > 0;
    return true;
  }
  if (category === 'tool') return config?.showThoughtChain !== false;
  if (category === 'file') return true;
  if (category === 'status') return config?.showStatusUpdates !== false;
  if (part.type === 'source-url' || part.type === 'source-document') {
    return config?.showSources === true;
  }
  // Unknown part type — fail-safe to visible.
  return true;
}

// Returns true if `message` has at least one part that renders visible UI.
// Used to decide whether the last assistant bubble should show typing dots
// while the agent is still working.
export function hasVisibleContent(message, config) {
  if (!message?.parts || message.parts.length === 0) return false;
  return message.parts.some((part) => isPartVisible(part, config));
}
