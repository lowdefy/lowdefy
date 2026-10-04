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

// Parses a webhook request body as JSON regardless of content-type (SNS posts
// JSON as text/plain). A body that is not JSON (a form-encoded Slack or Twilio
// post, an empty body) is passed through as the raw string.
function parseWebhookBody({ rawBody }) {
  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

export default parseWebhookBody;
