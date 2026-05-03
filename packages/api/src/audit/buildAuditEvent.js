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

import { randomUUID } from 'crypto';

function buildAuditEvent({ event, context, appFields }) {
  return {
    id: `evt_${randomUUID()}`,
    timestamp: new Date().toISOString(),
    eventType: event.eventType,
    category: event.category,
    severity: event.severity ?? 'medium',
    initiator: event.initiator ?? {},
    target: event.target ?? {},
    action: event.action,
    outcome: event.outcome,
    metadata: event.metadata ?? {},
    rid: context?.rid,
    appFields: appFields ?? {},
  };
}

export default buildAuditEvent;
