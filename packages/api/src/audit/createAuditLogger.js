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
import buildRequestProperties from './buildRequestProperties.js';
import createAuditQueue from './createAuditQueue.js';
import createRateLimiter from './createRateLimiter.js';
import dispatchAuditEvent from './dispatchAuditEvent.js';
import shouldAuditEvent from './shouldAuditEvent.js';
import shouldSampleEvent from './shouldSampleEvent.js';

const NOOP_LOGGER = { enabled: false, log: () => {}, flush: async () => {}, stop: async () => {} };

const loggerCache = new WeakMap();
let shutdownHookInstalled = false;
const shutdownTargets = new Set();

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

function installShutdownHook() {
  if (shutdownHookInstalled) return;
  shutdownHookInstalled = true;
  const handler = async () => {
    await Promise.all(
      Array.from(shutdownTargets).map((target) => target.stop().catch(() => {}))
    );
  };
  process.on('beforeExit', handler);
  process.on('SIGTERM', handler);
  process.on('SIGINT', handler);
}

function resolveAppFields({ fields, baseContext }) {
  if (type.isNone(fields) || Object.keys(fields).length === 0) return {};
  try {
    const parser = new ServerParser({
      jsMap: baseContext.jsMap,
      operators: baseContext.operators,
      secrets: baseContext.secrets,
      state: {},
      user: {},
    });
    const { output, errors } = parser.parse({
      input: fields,
      location: 'audit/fields',
      payload: {},
      steps: {},
    });
    if (errors.length > 0) {
      reportFailure(baseContext, errors[0]);
      return fields;
    }
    return output;
  } catch (err) {
    reportFailure(baseContext, err);
    return fields;
  }
}

function isAuditConfigured(auditConfig) {
  if (type.isNone(auditConfig)) return false;
  if (auditConfig.configured === false) return false;
  if (auditConfig.transport === 'stdout') return true;
  return !type.isNone(auditConfig.connectionId);
}

function instantiateLogger({ auditConfig, baseContext }) {
  const resolvedAppFields = resolveAppFields({ fields: auditConfig.fields, baseContext });
  const dispatchContext = { ...baseContext, __audit: true };
  const transport = auditConfig.transport ?? 'connection';

  async function flushBatch(events) {
    if (events.length === 0) return undefined;
    const requestProperties = buildRequestProperties({
      requestType: auditConfig.requestType,
      events,
    });
    return dispatchAuditEvent({
      context: dispatchContext,
      auditConfig,
      events,
      requestProperties,
    });
  }

  let queue = null;
  if (auditConfig.batch?.enabled) {
    queue = createAuditQueue({
      size: auditConfig.batch.size ?? 100,
      interval: auditConfig.batch.interval ?? 5000,
      flushFn: flushBatch,
      onError: (err) => reportFailure(baseContext, err),
    });
  }

  const rateLimiter = createRateLimiter({
    perSecond: auditConfig.rateLimit?.perSecond,
    onDrop: (count) => {
      try {
        baseContext?.logger?.warn(
          { event: 'audit_rate_limit_exceeded', dropped: count },
          `Audit rate limit exceeded: dropped ${count} events.`
        );
      } catch (_) {
        // logger failure is non-fatal
      }
    },
  });

  async function dispatchSingle(auditEvent) {
    const requestProperties = buildRequestProperties({
      requestType: auditConfig.requestType,
      events: [auditEvent],
    });
    return dispatchAuditEvent({
      context: dispatchContext,
      auditConfig,
      events: [auditEvent],
      requestProperties,
    });
  }

  async function log(event) {
    try {
      if (!shouldAuditEvent({ event, auditConfig })) return;
      if (!shouldSampleEvent({ event, sampling: auditConfig.sampling })) return;
      if (!rateLimiter.check()) return;

      const auditEvent = buildAuditEvent({
        event,
        context: { rid: event.rid },
        appFields: resolvedAppFields,
      });

      if (auditEvent.metadata) {
        auditEvent.metadata = applyMask(auditEvent.metadata, auditConfig.mask);
      }
      if (auditEvent.initiator) {
        auditEvent.initiator = applyMask(auditEvent.initiator, auditConfig.mask);
      }

      if (auditConfig.strict) {
        return await dispatchSingle(auditEvent);
      }

      if (queue) {
        queue.enqueue(auditEvent);
        return undefined;
      }

      setImmediate(() => {
        dispatchSingle(auditEvent).catch((err) => reportFailure(baseContext, err));
      });
      return undefined;
    } catch (err) {
      reportFailure(baseContext, err);
      if (auditConfig.strict) throw err;
      return undefined;
    }
  }

  async function flush() {
    if (queue) await queue.flush();
  }

  async function stop() {
    if (queue) await queue.stop();
  }

  const logger = { enabled: true, transport, log, flush, stop };

  if (queue) {
    shutdownTargets.add(logger);
    installShutdownHook();
  }

  return logger;
}

function createAuditLogger({ auditConfig, context }) {
  if (!isAuditConfigured(auditConfig)) return NOOP_LOGGER;
  if (context?.__audit) return NOOP_LOGGER;

  if (typeof auditConfig === 'object') {
    const cached = loggerCache.get(auditConfig);
    if (cached) return cached;
  }

  const logger = instantiateLogger({ auditConfig, baseContext: context });

  if (typeof auditConfig === 'object') {
    loggerCache.set(auditConfig, logger);
  }

  return logger;
}

export default createAuditLogger;
