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

import logEvent from '../../log/logEvent.js';

// The wide event every endpoint entry emits once its routine has run: the
// HTTP route (`api`), a CallApi step (`call_api`), a cron firing
// (`scheduled`), a webhook receiver (`webhook`) and a detached invocation
// (`detached`) all end here, so one query answers "what did this endpoint do"
// regardless of how it was entered.
function logEndpointCompleted(context, { endpointConfig, entry, error, startTime, status }) {
  const success = !['error', 'reject'].includes(status);
  logEvent({
    context,
    event: success ? 'endpoint_completed' : 'endpoint_failed',
    fields: {
      endpoint_id: endpointConfig.endpointId ?? endpointConfig.id,
      entry,
      config_key: endpointConfig['~k'],
      duration_ms: Math.round(performance.now() - startTime),
      status,
      success,
      error,
    },
  });
}

export default logEndpointCompleted;
