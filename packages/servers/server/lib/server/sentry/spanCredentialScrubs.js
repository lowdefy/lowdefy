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

// The credential scrub of the request each ended span belongs to, by span id, from the span's
// end until Sentry has run beforeSendSpan on it. A streamed span reaches beforeSendSpan as plain
// data with no scope, so trackSpanCredentialScrubs records the scrub while the span itself is at
// hand and scrubSpan takes it out. Every entry is removed when the span has finished ending,
// whether Sentry sent it or not (an unsampled span), so the map holds only spans ending right now.
const spanCredentialScrubs = new Map();

export default spanCredentialScrubs;
