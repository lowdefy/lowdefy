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
  return `${text.slice(0, MESSAGE_LIMIT - 1)}…`;
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

function carriesAiSdkError(error, depth = 0) {
  if (!(error instanceof Error)) return false;
  if (isAiSdkError(error)) return true;
  const cause = error.lastError ?? error.cause;
  return depth < CAUSE_DEPTH && carriesAiSdkError(cause, depth + 1);
}

// What an agent run may throw on to the routine, which logs a thrown error whole (its message,
// stack and causes). An error with an AI SDK error in its chain is replaced by one that says
// only what agentErrorForLog would: its name, code, statusCode and, for an APICallError, the
// message. Any other error is thrown as it is.
function agentErrorForThrow(error) {
  if (!carriesAiSdkError(error)) return error;
  const summary = agentErrorForLog(error);
  const safe = new Error(summary.message ?? `${summary.name} (message withheld from logs).`);
  safe.name = summary.name;
  if (summary.code !== undefined) safe.code = summary.code;
  if (summary.statusCode !== undefined) safe.statusCode = summary.statusCode;
  return safe;
}

// What every agent log names its run by: ids, never the conversation's content.
function agentLogIds({ agent, context }) {
  return {
    agentId: agent.agentId,
    conversationId: context.agentContext?.conversationId ?? null,
  };
}

// One log line: the event's ids and the error's summary as JSON, for console.warn and
// console.error, which this line logs through.
function agentLogLine(text, fields) {
  return `${text} ${JSON.stringify(fields)}`;
}

export { agentErrorForThrow, agentLogIds, agentLogLine };
export default agentErrorForLog;
