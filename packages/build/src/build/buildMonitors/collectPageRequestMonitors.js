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

import resolveMonitorSource from './resolveMonitorSource.js';

function collectPageRequestMonitors({ components, context, defaults }) {
  const monitors = [];
  (components.pages ?? []).forEach((page) => {
    if (type.isNone(page?.pageId)) return;
    (page.requests ?? []).forEach((request) => {
      if (type.isNone(request?.requestId)) return;
      const configKey = request['~k'];
      const source = resolveMonitorSource({ configKey, context });
      const unit = { type: 'page_request', id: `${page.pageId}.${request.requestId}` };
      const filter = { page_id: page.pageId, request_id: request.requestId };
      monitors.push({
        id: `page_request:${page.pageId}:${request.requestId}:latency_p95`,
        unit,
        event: 'request_completed',
        description: `Request "${request.requestId}" on page "${page.pageId}" is slower than ${defaults.p95_ms}ms at p95.`,
        rule: {
          type: 'latency_p95',
          window_minutes: defaults.window_minutes,
          threshold_ms: defaults.p95_ms,
          comparison: 'above',
          field: 'duration_ms',
          target: { event: 'request_completed', filter },
        },
        config_key: configKey ?? null,
        source,
        status: 'active',
      });
      monitors.push({
        id: `page_request:${page.pageId}:${request.requestId}:error_rate`,
        unit,
        event: 'request_failed',
        description: `Request "${request.requestId}" on page "${
          page.pageId
        }" is failing more than ${defaults.error_rate * 100}% of the time.`,
        rule: {
          type: 'error_rate',
          window_minutes: defaults.window_minutes,
          threshold: defaults.error_rate,
          comparison: 'above',
          failure: { event: 'request_failed', filter },
          total: { events: ['request_completed', 'request_failed'], filter },
        },
        config_key: configKey ?? null,
        source,
        status: 'active',
      });
    });
  });
  return monitors;
}

export default collectPageRequestMonitors;
