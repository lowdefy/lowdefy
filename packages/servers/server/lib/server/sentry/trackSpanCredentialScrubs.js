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

import spanCredentialScrubs from './spanCredentialScrubs.js';

// Sentry ends a span in three steps: spanEnd, then afterSpanEnd, whose SpanStreaming hook builds
// the span's data and runs beforeSendSpan on it at once, then the span is buffered to be sent.
// The scrub is read at spanEnd, from the isolation scope the span started in: the request's own,
// on which the Sentry middleware put it. Hooks run in the order they were added, so the
// afterSpanEnd hook added here, after Sentry.init, runs after beforeSendSpan and removes the
// entry of a span Sentry did not send. getCapturedScopesOnSpan comes from @sentry/core, which the
// caller imports only when Sentry is on.
function trackSpanCredentialScrubs({ client, getCapturedScopesOnSpan }) {
  client.on('spanEnd', (span) => {
    const { isolationScope } = getCapturedScopesOnSpan(span);
    // A span outside a request (start-up, a timer) has no request scrub; scrubSpan still
    // scrubs it of the server's secrets. The scope is held weakly, so it can be gone.
    const scrubRequestCredentials =
      isolationScope?.getScopeData().sdkProcessingMetadata.scrubRequestCredentials;
    if (!type.isNone(scrubRequestCredentials)) {
      spanCredentialScrubs.set(span.spanContext().spanId, scrubRequestCredentials);
    }
  });
  client.on('afterSpanEnd', (span) => {
    spanCredentialScrubs.delete(span.spanContext().spanId);
  });
}

export default trackSpanCredentialScrubs;
