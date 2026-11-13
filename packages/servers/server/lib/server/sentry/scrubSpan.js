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

import scrubEvent from './scrubEvent.js';
import spanCredentialScrubs from './spanCredentialScrubs.js';

// What is sent in place of a span the scrub failed on: its place in the trace and its timing,
// none of its data. Sentry sends a span unchanged when beforeSendSpan throws, and sends it
// anyway when beforeSendSpan returns nothing, so this function never throws.
function stripSpan(span) {
  return {
    trace_id: span.trace_id,
    span_id: span.span_id,
    parent_span_id: span.parent_span_id,
    name: '[REDACTED]',
    start_timestamp: span.start_timestamp,
    end_timestamp: span.end_timestamp,
    status: span.status,
    is_segment: span.is_segment,
    attributes: { 'lowdefy.scrub_failed': true },
  };
}

// beforeSendSpan: scrubs a streamed span of the server's secrets and of the credentials its
// request marked (see trackSpanCredentialScrubs).
function scrubSpan(span) {
  const scrubRequestCredentials = spanCredentialScrubs.get(span.span_id);
  spanCredentialScrubs.delete(span.span_id);
  try {
    return scrubEvent(span, { scrubRequestCredentials });
  } catch {
    return stripSpan(span);
  }
}

export default scrubSpan;
