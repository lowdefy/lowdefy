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
import applyMask from './applyMask.js';
import buildAuditEvent from './buildAuditEvent.js';
import buildRequestProperties from './buildRequestProperties.js';
import dispatchAuditEvent from './dispatchAuditEvent.js';
import shouldAuditEvent from './shouldAuditEvent.js';

const NOOP_LOGGER = { enabled: false, log: () => {} };

function reportFailure(context, err) {
  try {
    context?.logger?.warn(
      { event: 'audit_write_failed', err },
      `Audit write failed: ${err?.message}`
    );
  } catch (_) {
    // logger failure is non-fatal
  }
}

function createAuditLogger({ auditConfig, context }) {
  if (
    type.isNone(auditConfig) ||
    type.isNone(auditConfig.connectionId) ||
    auditConfig.configured === false
  ) {
    return NOOP_LOGGER;
  }

  if (context?.__audit) {
    return NOOP_LOGGER;
  }

  async function log(event) {
    try {
      if (!shouldAuditEvent({ event, auditConfig })) return;

      const auditEvent = buildAuditEvent({
        event,
        context,
        appFields: auditConfig.fields,
      });

      if (auditEvent.metadata) {
        auditEvent.metadata = applyMask(auditEvent.metadata, auditConfig.mask);
      }
      if (auditEvent.initiator) {
        auditEvent.initiator = applyMask(auditEvent.initiator, auditConfig.mask);
      }

      const requestProperties = buildRequestProperties({
        requestType: auditConfig.requestType,
        event: auditEvent,
      });

      const dispatchContext = { ...context, __audit: true };

      if (auditConfig.strict) {
        return await dispatchAuditEvent({
          context: dispatchContext,
          auditConfig,
          event: auditEvent,
          requestProperties,
        });
      }

      setImmediate(() => {
        dispatchAuditEvent({
          context: dispatchContext,
          auditConfig,
          event: auditEvent,
          requestProperties,
        }).catch((err) => reportFailure(context, err));
      });
      return undefined;
    } catch (err) {
      reportFailure(context, err);
      if (auditConfig.strict) throw err;
      return undefined;
    }
  }

  return { enabled: true, log };
}

export default createAuditLogger;
