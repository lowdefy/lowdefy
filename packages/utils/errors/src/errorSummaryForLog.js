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

import readErrorCodes from './readErrorCodes.js';

// What a log may say about an error. Chat text and other inputs can hold personal information,
// and logs have their own retention and access, so a log carries no prompt, request property,
// tool input or document. An error carries them where a plain `{ err }` log would write them: a
// driver's error embeds the document it rejected, an AI SDK TypeValidationError's or
// JSONParseError's message embeds the value it rejected (the whole conversation, a tool's
// input), InvalidToolInputError, ToolCallRepairError and RetryError repeat their cause's
// message, and every stack opens with its message. So an AI SDK error is summarised by name
// and code alone, except APICallError, whose message is the provider's reply; any other error
// keeps its name, code, status code and message, cut to 500 characters, and none of its other
// fields. Causes are followed the same way, three deep.

const MESSAGE_LIMIT = 500;
const CAUSE_DEPTH = 3;

// AISDKError.isInstance reads this marker; the error classes themselves are not imported so
// any copy of the AI SDK in the app is recognised.
const aiSdkErrorMarker = Symbol.for('vercel.ai.error');

function isAiSdkError(error) {
  return error[aiSdkErrorMarker] === true;
}

// An error from another realm, such as a DOMException in a VM context, fails instanceof Error.
function isError(value) {
  if (value instanceof Error) return true;
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.stack === 'string' &&
    typeof value.message === 'string'
  );
}

function truncate(text) {
  if (text.length <= MESSAGE_LIMIT) return text;
  return `${text.slice(0, MESSAGE_LIMIT - 1)}…`;
}

function errorSummaryForLog(error, depth = 0) {
  if (!isError(error)) {
    return { name: typeof error };
  }
  const summary = { name: error.name };
  if (!isAiSdkError(error) || error.name === 'AI_APICallError') {
    summary.message = truncate(String(error.message));
  }
  const { code, statusCode } = readErrorCodes(error);
  if (code !== undefined) summary.code = code;
  if (statusCode !== undefined) summary.statusCode = statusCode;
  // A RetryError holds the attempt that failed last as lastError rather than as its cause.
  const cause = error.lastError ?? error.cause;
  if (cause !== undefined && depth < CAUSE_DEPTH) {
    summary.cause = errorSummaryForLog(cause, depth + 1);
  }
  return summary;
}

export default errorSummaryForLog;
