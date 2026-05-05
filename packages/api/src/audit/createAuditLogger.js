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
import { ServerParser } from '@lowdefy/operators';
import applyMask from './applyMask.js';
import buildAuditEvent from './buildAuditEvent.js';
import createRateLimiter from './createRateLimiter.js';
import shouldAuditEvent from './shouldAuditEvent.js';
import shouldSampleEvent from './shouldSampleEvent.js';

const NOOP_LOGGER = { enabled: false, log: () => {} };

function reportFailure(context, err) {
  try {
    context?.logger?.warn(
      { event: 'audit_emit_failed', err },
      `Audit emit failed: ${err?.message}`
    );
  } catch (_) {
    // logger failure is non-fatal
  }
}

function resolveAppFields({ fields, context }) {
  if (type.isNone(fields) || Object.keys(fields).length === 0) return {};
  try {
    const parser = new ServerParser({
      jsMap: context.jsMap,
      operators: context.operators,
      secrets: context.secrets,
      state: {},
      user: {},
    });
    const { output, errors } = parser.parse({
      input: fields,
      location: 'logger.audit.fields',
      payload: {},
      steps: {},
    });
    if (errors.length > 0) {
      reportFailure(context, errors[0]);
      return fields;
    }
    return output;
  } catch (err) {
    reportFailure(context, err);
    return fields;
  }
}

function isAuditEnabled(auditConfig) {
  if (type.isNone(auditConfig)) return false;
  if (auditConfig.enabled === false) return false;
  if (type.isNone(auditConfig.events) || auditConfig.events.length === 0) return false;
  return true;
}

function createAuditLogger({ auditConfig, context }) {
  if (!isAuditEnabled(auditConfig)) return NOOP_LOGGER;
  if (type.isNone(context?.logger?.child)) return NOOP_LOGGER;

  const auditChild = context.logger.child({ audit: true });
  const resolvedAppFields = resolveAppFields({ fields: auditConfig.fields, context });

  const rateLimiter = createRateLimiter({
    perSecond: auditConfig.rateLimit?.perSecond,
    onDrop: (count) => {
      try {
        context.logger.warn(
          { event: 'audit_rate_limit_exceeded', dropped: count },
          `Audit rate limit exceeded: dropped ${count} events.`
        );
      } catch (_) {
        // logger failure is non-fatal
      }
    },
  });

  function log(event) {
    try {
      if (!shouldAuditEvent({ event, auditConfig })) return;
      if (!shouldSampleEvent({ event, sampling: auditConfig.sampling })) return;
      if (!rateLimiter.check()) return;

      const auditEvent = buildAuditEvent({
        event,
        context: { rid: event.rid ?? context.rid },
        appFields: resolvedAppFields,
      });

      if (auditEvent.metadata) {
        auditEvent.metadata = applyMask(auditEvent.metadata, auditConfig.mask);
      }
      if (auditEvent.initiator) {
        auditEvent.initiator = applyMask(auditEvent.initiator, auditConfig.mask);
      }

      auditChild.info(
        { event: 'audit_event', auditEvent },
        `audit ${auditEvent.eventType}`
      );
    } catch (err) {
      reportFailure(context, err);
    }
  }

  return { enabled: true, log };
}

export default createAuditLogger;
