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

import { type } from '@lowdefy/helpers';

// Reports how far one tool call is, as MCP progress. A client that wants
// progress sends a progress token with the call; without one the protocol
// allows none, so nothing is sent.
function createProgressSender({ request, extra }) {
  const progressToken = request.params._meta?.progressToken;
  return async function sendProgress({ progress, total, message }) {
    if (type.isNone(progressToken)) {
      return;
    }
    try {
      await extra.sendNotification({
        method: 'notifications/progress',
        params: { progressToken, progress, total, message },
      });
    } catch {
      // The client has gone or its transport closed. The run goes on: its
      // results are still written to disk.
    }
  };
}

export default createProgressSender;
