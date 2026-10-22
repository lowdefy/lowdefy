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

import { errorSummaryForLog } from '@lowdefy/errors';

// What an agent log may say about an error: the summary every Lowdefy log of an error uses (its
// name, code, status code and message cut to 500 characters, with an AI SDK error's message left
// out but for an APICallError's, and the same for three causes). Chat text can hold personal
// information, so no agent log carries messages, prompts, tool inputs or tool outputs.
const agentErrorForLog = errorSummaryForLog;

const CAUSE_DEPTH = 3;

// AISDKError.isInstance reads this marker; the error classes themselves are not imported so
// any copy of the AI SDK in the app is recognised.
const aiSdkErrorMarker = Symbol.for('vercel.ai.error');

function isAiSdkError(error) {
  return error[aiSdkErrorMarker] === true;
}

// The stack's frames without its opening lines, which repeat the message. The lines are
// dropped by count, not by shape: a message can hold a line that looks like a frame.
function stackFramesForLog(error) {
  if (!(error instanceof Error) || typeof error.stack !== 'string') return [];
  const headerLineCount = String(error).split('\n').length;
  return error.stack
    .split('\n')
    .slice(headerLineCount)
    .filter((line) => /^\s+at /.test(line))
    .map((line) => line.trim());
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

export { agentErrorForThrow, agentLogIds, stackFramesForLog };
export default agentErrorForLog;
