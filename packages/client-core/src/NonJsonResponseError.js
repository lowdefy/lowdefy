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

import { translate } from '@lowdefy/helpers';

// An error response whose body is not the app's JSON: the host answered
// itself, before or instead of the app (a platform failure such as Vercel's
// "A server error has occurred", a gateway, or the server's request timeout).
// The message is for the person; status and the start of the body, which names
// the host's error code and request id, are for whoever reads the log.
class NonJsonResponseError extends Error {
  constructor({ status, text }) {
    super(
      status === 504
        ? translate({ key: 'client.requestTimedOut' })
        : translate({ key: 'client.serverUnavailable', values: { status } })
    );
    this.name = 'NonJsonResponseError';
    this.status = status;
    this.responseText = text.trim().slice(0, 300);
  }
}

export default NonJsonResponseError;
