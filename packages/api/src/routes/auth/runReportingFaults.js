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

import { isExpectedError } from '@lowdefy/errors';

// Runs work BetterAuth calls back into (an auth email send) in a system context, and reports
// a fault through that context's error sink before it propagates. BetterAuth runs some of these
// as background tasks, where it only writes its own "Failed to run background task" line; the
// sink resolves the config location and sends the fault to error tracking. The error is marked
// handled, so that line and createOnAPIError do not report it again. An expected outcome
// propagates without a report.
async function runReportingFaults({ context, run }) {
  try {
    return await run();
  } catch (error) {
    if (!isExpectedError(error)) {
      await context.handleError(error);
    }
    throw error;
  }
}

export default runReportingFaults;
