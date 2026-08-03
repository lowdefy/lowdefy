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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// The tenant preflight: under policy: tenant, refuse to serve while any
// walled collection holds unstamped rows. The wall filters every read on the
// tenant field, so a deployment that flips to tenant before backfilling gets
// every walled read silently blank - this converts that into one loud,
// immediate failure naming the collections to backfill.
//
// There is no awaited boot hook that gates serving (and a Vercel cold start
// would turn a boot refusal into an opaque function crash), so the preflight
// is lazily-run-once and awaited per request in the api-context middleware -
// the same shape as resolvePinnedOrganization. Memoization is split like
// ensureOrganization's: a refusal (unstamped rows, a ConfigError) memoizes
// permanently - the app stays down-but-explaining-itself until the backfill
// runs and the server restarts - while a probe failure (connectivity,
// timeout) does not memoize and retries on the next request.
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
  const evaluateOperators = createEvaluateOperators(context);
  const targets = new Map();
  for (const entry of tenantConnections) {
    const plugin = context.connections[entry.type];
    if (plugin?.meta?.tenant !== true) {
      // The contract violation is a build error and a resolveTenant error -
      // the preflight does not repeat the refusal, it just can not probe.
      continue;
    }
    if (!type.isFunction(plugin.tenantPreflight)) {
      context.logger.warn(
        `Tenant preflight can not probe connection "${entry.connectionId}" - connection type "${entry.type}" implements the tenant contract but no tenantPreflight capability.`
      );
      continue;
    }
    const connectionConfig = await context.readConfigFile(
      `connections/${entry.connectionId}.json`
    );
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
    const field = entry.tenant === true ? 'organizationId' : entry.tenant.field;
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

async function runPreflight(context) {
  const tenantConnections = await context.readConfigFile('tenantConnections.json');
  if (type.isNone(tenantConnections)) {
    // A build older than the preflight has no index artifact - nothing to
    // enumerate, so the preflight can not protect this deployment.
    context.logger.warn(
      'Tenant preflight skipped - no tenantConnections.json build artifact. Rebuild with a matching lowdefy version to enable the unstamped-rows check.'
    );
    return;
  }
  const targets = await collectTargets(context, { tenantConnections });
  const results = await probeTargets(context, { targets });
  const offenders = results.filter((result) => result.ok === false);
  if (offenders.length > 0) {
    throw new ConfigError(
      `Tenant preflight refused to serve the app: ${offenders
        .map((result) => describeTarget(result.target))
        .join('; ')} ${
        offenders.length === 1 ? 'holds' : 'hold'
      } documents without the tenant field ${offenders
        .map((result) => `"${result.target.field}"`)
        .filter((fieldName, index, all) => all.indexOf(fieldName) === index)
        .join(', ')}. Under auth.organizations.policy: tenant the wall filters every walled read on the tenant field, so these documents would be silently invisible. Backfill the field on the listed collections, then restart the server.`
    );
  }
  const failures = results.filter((result) => result.error);
  if (failures.length > 0) {
    throw failures[0].error;
  }
  context.logger.info(
    `Tenant preflight passed - ${targets.size} walled ${
      targets.size === 1 ? 'target carries' : 'targets carry'
    } no unstamped rows.`
  );
}

function resolveTenantPreflight(context) {
  if (context.organization?.policy !== 'tenant') {
    return Promise.resolve();
  }
  if (!preflightByConfig.has(context.config)) {
    preflightByConfig.set(
      context.config,
      runPreflight(context).catch((error) => {
        if (!(error instanceof ConfigError)) {
          // Connectivity-class failure - retry on the next request. A refusal
          // stays memoized: the data does not fix itself, the backfill does.
          preflightByConfig.delete(context.config);
        }
        throw error;
      })
    );
  }
  return preflightByConfig.get(context.config);
}

export default resolveTenantPreflight;
