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

import { TenantIntegrityError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// The tenant preflight: under policy: tenant, find walled collections that
// hold rows without the tenant field and report them. The wall filters every
// read on the tenant field, so those rows are invisible - a data fault, not a
// reason to take the app down. The preflight therefore only reports: one
// TenantIntegrityError log line per offending target (plus one Sentry capture),
// and the per-target verdicts stay readable through getTenantIntegrityStatus.
// It never throws into a request and never blocks one - walled reads already
// filter by organisation, so the unstamped rows are simply not served.
//
// It is lazily-run-once per config build artifact, started (not awaited) by the
// per-request middleware - the same shape as resolvePinnedOrganization.
// Memoization: a completed check (clean or offending) memoizes for the life of
// the process; a probe failure (connectivity, timeout) logs a warning and clears
// the memo so the next request retries.
//
// Enumerating the walled set reads the tenantConnections.json build artifact
// (writeConnections). Each connection's properties evaluate with the same
// caller-less operator machinery requests use - _secret resolves, caller
// operators resolve to nothing - so a connection whose properties need a
// payload can not be probed and is skipped with a warning. The probe itself
// is a connection-type capability (connection.tenantPreflight), the same
// seam as the meta.tenant contract; a tenant-capable type without one is
// skipped with a warning.
//
// Memoization is keyed on the config build artifact - one module-level
// object per process in the servers - rather than a bare module singleton,
// mirroring how the organization binding keys on the auth instance.
const preflightByConfig = new WeakMap();
const statusByConfig = new WeakMap();

async function probeTargets(context, { targets }) {
  return Promise.all(
    [...targets.values()].map(async (target) => {
      try {
        const { ok } = await target.plugin.tenantPreflight({
          connection: target.properties,
          field: target.field,
        });
        return { target, ok };
      } catch (error) {
        return { target, error };
      }
    })
  );
}

async function collectTargets(context, { tenantConnections }) {
  // Caller-less by contract: the verdict is memoized per process, so
  // connection properties must never resolve against whichever caller happens
  // to hit the cold process first - _user reads resolve to nothing, exactly
  // like a system-context request.
  const evaluateOperators = createEvaluateOperators({ ...context, user: null });
  const targets = new Map();
  for (const entry of tenantConnections) {
    const plugin = context.connections[entry.type];
    if (plugin?.meta?.tenant !== true) {
      // The contract violation is a build error and a resolveTenancy error -
      // the preflight does not repeat the refusal, it just can not probe.
      continue;
    }
    if (!type.isFunction(plugin.tenantPreflight)) {
      context.logger.warn(
        `Tenant preflight can not probe connection "${entry.connectionId}" - connection type "${entry.type}" implements the tenant contract but no tenantPreflight capability.`
      );
      continue;
    }
    const connectionConfig = await context.readConfigFile(`connections/${entry.connectionId}.json`);
    if (!connectionConfig) {
      context.logger.warn(
        `Tenant preflight can not probe connection "${entry.connectionId}" - no connection artifact found.`
      );
      continue;
    }
    let properties;
    try {
      properties = evaluateOperators({
        input: connectionConfig.properties || {},
        location: entry.connectionId,
        payload: {},
        state: {},
        steps: {},
      });
    } catch (error) {
      context.logger.warn(
        { err: error },
        `Tenant preflight can not probe connection "${entry.connectionId}" - its properties do not evaluate outside a request.`
      );
      continue;
    }
    const field = type.isObject(entry.tenant) ? entry.tenant.field : 'organization_id';
    // Several connections usually declare the same physical collection -
    // probe each evaluated target once.
    const key = JSON.stringify([entry.type, field, properties]);
    const target = targets.get(key) ?? { connectionIds: [], field, plugin, properties };
    target.connectionIds.push(entry.connectionId);
    targets.set(key, target);
  }
  return targets;
}

function describeTarget(target) {
  const connections = target.connectionIds.map((id) => `"${id}"`).join(', ');
  if (type.isString(target.properties?.collection)) {
    return `collection "${target.properties.collection}" (connections ${connections})`;
  }
  return `connections ${connections}`;
}

function reportOffender(context, { captureError, target }) {
  const collection = type.isString(target.properties?.collection)
    ? target.properties.collection
    : null;
  const error = new TenantIntegrityError(
    `Tenant integrity: ${describeTarget(target)} holds documents without the tenant field "${
      target.field
    }". The wall filters every walled read on that field, so these documents are invisible to every organisation. The app keeps serving; backfill or remove the rows.`,
    {
      collection,
      connectionId: target.connectionIds[0],
      field: target.field,
    }
  );
  context.logger.error(
    {
      err: error,
      event: 'tenant_integrity_error',
      collection,
      connectionIds: target.connectionIds,
      field: target.field,
    },
    error.message
  );
  if (type.isFunction(captureError)) {
    try {
      captureError(error);
    } catch (captureFailure) {
      context.logger.warn({ err: captureFailure }, 'Tenant integrity error could not be captured.');
    }
  }
}

async function runPreflight(context, { captureError }) {
  const tenantConnections = await context.readConfigFile('tenantConnections.json');
  if (type.isNone(tenantConnections)) {
    // A build older than the preflight has no index artifact - nothing to
    // enumerate, so the preflight can not protect this deployment.
    context.logger.warn(
      'Tenant preflight skipped - no tenantConnections.json build artifact. Rebuild with a matching lowdefy version to enable the unstamped-rows check.'
    );
    return [];
  }
  const targets = await collectTargets(context, { tenantConnections });
  const results = await probeTargets(context, { targets });
  const failures = results.filter((result) => result.error);
  if (failures.length > 0) {
    // A probe that could not reach the datastore is an outage, not a verdict.
    throw failures[0].error;
  }
  const offenders = results.filter((result) => result.ok === false);
  offenders.forEach((result) => reportOffender(context, { captureError, target: result.target }));
  if (offenders.length === 0) {
    context.logger.info(
      `Tenant preflight passed - ${targets.size} walled ${
        targets.size === 1 ? 'target carries' : 'targets carry'
      } no unstamped rows.`
    );
  }
  return results.map((result) => ({
    collection: result.target.properties?.collection ?? null,
    connectionIds: result.target.connectionIds,
    field: result.target.field,
    ok: result.ok !== false,
  }));
}

// Resolves once the check has run. The returned promise never rejects, so a
// request can neither fail on it nor be blocked by a fault in it.
function resolveTenantPreflight(context, { captureError } = {}) {
  if (context.organization?.policy !== 'tenant') {
    return Promise.resolve();
  }
  if (!preflightByConfig.has(context.config)) {
    preflightByConfig.set(
      context.config,
      runPreflight(context, { captureError })
        .then((status) => {
          statusByConfig.set(context.config, status);
        })
        .catch((error) => {
          // Connectivity-class failure - retry on the next request.
          preflightByConfig.delete(context.config);
          context.logger.warn(
            { err: error },
            'Tenant preflight could not probe the walled collections - it will retry on the next request.'
          );
        })
    );
  }
  return preflightByConfig.get(context.config);
}

// The per-target verdicts of the completed check, or undefined before it has run.
function getTenantIntegrityStatus(config) {
  return statusByConfig.get(config);
}

export { getTenantIntegrityStatus };
export default resolveTenantPreflight;
