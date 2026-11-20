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

// The headers a webhook is posted with, from those a test or a journey's webhook step writes,
// named as the route reads them: HTTP sends header names case-insensitively and the server reads
// them lower-cased, so a verifier reads headers['x-signature'] whichever case the test wrote.
function toWebhookHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([name, value]) => [name.toLowerCase(), value])
  );
}

export default toWebhookHeaders;
