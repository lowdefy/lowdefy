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

// What an agent log may say about an error. Chat text can hold personal information, and
// logs have their own retention and access, so no log carries messages, prompts, tool inputs
// or tool outputs. An error carries them where a plain `{ err }` log would write them: a
// TypeValidationError's or JSONParseError's message embeds the value it rejected (the whole
// conversation, a tool's input), InvalidToolInputError, ToolCallRepairError and RetryError
// repeat their cause's message, and every stack opens with its message. So an AI SDK error is
// logged by name and code alone, except APICallError, whose message is the provider's reply;
// any other error keeps its message, cut to 500 characters. Causes are followed the same way.

const MESSAGE_LIMIT = 500;
const CAUSE_DEPTH = 3;

// AISDKError.isInstance reads this marker; the error classes themselves are not imported so
// any copy of the AI SDK in the app is recognised.
const aiSdkErrorMarker = Symbol.for('vercel.ai.error');

function isAiSdkError(error) {
  return error[aiSdkErrorMarker] === true;
}

function truncate(text) {
  if (text.length <= MESSAGE_LIMIT) return text;
  return `${text.slice(0, MESSAGE_LIMIT)}…`;
}

function agentErrorForLog(error, depth = 0) {
  if (!(error instanceof Error)) {
    return { name: typeof error };
  }
  const summary = { name: error.name };
  if (!isAiSdkError(error) || error.name === 'AI_APICallError') {
    summary.message = truncate(String(error.message));
  }
  if (error.code !== undefined) summary.code = error.code;
  if (error.statusCode !== undefined) summary.statusCode = error.statusCode;
  // A RetryError holds the attempt that failed last as lastError rather than as its cause.
  const cause = error.lastError ?? error.cause;
  if (cause !== undefined && depth < CAUSE_DEPTH) {
    summary.cause = agentErrorForLog(cause, depth + 1);
  }
  return summary;
}

// The stack's frames without its opening lines, which repeat the message.
function stackFramesForLog(error) {
  if (!(error instanceof Error) || typeof error.stack !== 'string') return [];
  return error.stack
    .split('\n')
    .filter((line) => /^\s+at /.test(line))
    .map((line) => line.trim());
}

// What every agent log names its run by: ids, never the conversation's content.
function agentLogIds({ agent, context }) {
  return {
    agentId: agent.agentId,
    conversationId: context.agentContext?.conversationId ?? null,
  };
}

export { agentLogIds, stackFramesForLog };
export default agentErrorForLog;
