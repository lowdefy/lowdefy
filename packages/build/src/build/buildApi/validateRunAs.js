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
import { ConfigError } from '@lowdefy/errors';

// The caller controls the payload (a browser or an API client), so an
// organization id read from it lets any caller name any organization and read
// its rows. Every other source - a previous step, the caller's own identity, a
// secret, an environment or build value - is authored server-side. On the
// server `state` is one of those: it starts `{}` on every entry point and only
// a `:set_state` step writes it, so a step-level runAs may read `_state`. At
// endpoint level `_state` is not dangerous, it is empty - the runAs is
// resolved before the routine runs - so it gets its own message.
//
// This is an operator SCAN, not an allowlist: a new operator is permitted by
// default; only the sources named here are refused, wherever they sit in the
// subtree (a `_js` argument included).
function findOperator(value, operators) {
  if (type.isArray(value)) {
    for (const item of value) {
      const found = findOperator(item, operators);
      if (found) return found;
    }
    return null;
  }
  if (!type.isObject(value)) {
    return null;
  }
  for (const key of Object.keys(value)) {
    const operator = operators.find((op) => key === op || key.startsWith(`${op}.`));
    if (operator) return operator;
    const found = findOperator(value[key], operators);
    if (found) return found;
  }
  return null;
}

// `location` reads `Api endpoint "<id>"` or `Step "<id>" at endpoint "<id>"`.
// `level` is 'endpoint' unless a caller says otherwise, because an endpoint's
// runAs is the stricter of the two.
function validateRunAs({ runAs, location, configKey, level = 'endpoint' }) {
  if (type.isNone(runAs)) return;
  if (!type.isObject(runAs) || type.isNone(runAs.organizationId)) {
    throw new ConfigError(`${location} "runAs" should be an object with an "organizationId".`, {
      received: runAs,
      configKey,
      checkSlug: 'tenant-run-as',
    });
  }
  if (type.isString(runAs.organizationId) && runAs.organizationId.trim() === '') {
    throw new ConfigError(
      `${location} "runAs.organizationId" is an empty string. A routine can not run as an unnamed organization - remove the runAs, or give it the id of the organization the routine should be scoped to.`,
      { received: runAs.organizationId, configKey, checkSlug: 'tenant-run-as' }
    );
  }
  if (level === 'endpoint' && findOperator(runAs.organizationId, ['_state'])) {
    throw new ConfigError(
      `${location} "runAs.organizationId" reads "_state" — _state is empty when an endpoint's runAs is evaluated, before any step has run. Use _user, _secret or a step-level runAs.`,
      { received: runAs.organizationId, configKey, checkSlug: 'tenant-run-as' }
    );
  }
  const operator = findOperator(runAs.organizationId, ['_payload']);
  if (operator) {
    throw new ConfigError(
      `${location} "runAs.organizationId" reads "${operator}" — the organization a routine runs as can not come from the caller. A browser or an API client controls the payload, so any caller could name another organization and read its rows. Derive it from a previous step (_step), from the caller (_user), or from a secret or environment value.`,
      { received: runAs.organizationId, configKey, checkSlug: 'tenant-run-as' }
    );
  }
}

export default validateRunAs;
