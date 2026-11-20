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

// The raw text a webhook is posted with, from a body a test or a journey's webhook step writes: a
// string as written, since a sender's signature is computed over the exact bytes, and anything
// else as JSON, the format most senders post.
function toWebhookBody(body) {
  if (type.isString(body)) {
    return body;
  }
  return JSON.stringify(body);
}

export default toWebhookBody;
