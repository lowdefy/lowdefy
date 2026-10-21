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

import { errorSummaryForLog, readErrorCodes } from '@lowdefy/errors';

// Stack frames name code, never data, so they are kept; the stack's first line repeats the
// message and is rebuilt from the summary's.
function stackFrames(error) {
  return String(error.stack ?? '')
    .split('\n')
    .filter((line) => /^\s+at /.test(line));
}

function fromSummary(summary, original) {
  const message = summary.message ?? `${summary.name} (message withheld from logs).`;
  const error = new Error(message);
  error.name = summary.name;
  error.stack = [`${summary.name}: ${message}`, ...stackFrames(original)].join('\n');
  if (summary.code !== undefined) error.code = summary.code;
  if (summary.statusCode !== undefined) error.statusCode = summary.statusCode;
  const cause = original.lastError ?? original.cause;
  if (summary.cause !== undefined && cause instanceof Error) {
    error.cause = fromSummary(summary.cause, cause);
  }
  return error;
}

// A request resolver's error rebuilt from its log summary: the name, code, status code and
// message cut to 500 characters, with the stack frames, for the error and three causes. A
// connection's error can carry the request's inputs in its other fields - a MongoDB write
// error the document it rejected, an HTTP client's error the request body - and every log
// and error report of the routine writes the error it is thrown, so none of them is kept.
function summarisedError(error) {
  if (!(error instanceof Error)) {
    const { code, statusCode } = readErrorCodes(error);
    return fromSummary(
      {
        name: 'Error',
        message: `Request resolver threw a value of type ${typeof error}, not an error.`,
        code,
        statusCode,
      },
      {}
    );
  }
  return fromSummary(errorSummaryForLog(error), error);
}

export default summarisedError;
