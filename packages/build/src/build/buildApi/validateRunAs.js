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

// The caller controls the payload (a browser or an API client) and the page
// state (the browser), so an organization id read from either lets any caller
// name any organization and read its rows. Every other source - a previous
// step, the caller's own identity, a secret, an environment or build value -
// is authored server-side. This is an operator SCAN, not an allowlist: a new
// operator is permitted by default; only the two caller-controlled sources
// are refused, wherever they sit in the subtree (a `_js` argument included).
const forbiddenOperators = ['_payload', '_state'];

function findForbiddenOperator(value) {
  if (type.isArray(value)) {
    for (const item of value) {
      const found = findForbiddenOperator(item);
      if (found) return found;
    }
    return null;
  }
  if (!type.isObject(value)) {
    return null;
  }
  for (const key of Object.keys(value)) {
    const operator = forbiddenOperators.find((op) => key === op || key.startsWith(`${op}.`));
    if (operator) return operator;
    const found = findForbiddenOperator(value[key]);
    if (found) return found;
  }
  return null;
}

// `location` reads `Api endpoint "<id>"` or `Step "<id>" at endpoint "<id>"`.
function validateRunAs({ runAs, location, configKey }) {
  if (type.isUndefined(runAs)) return;
  if (!type.isObject(runAs) || type.isUndefined(runAs.organizationId)) {
    throw new ConfigError(`${location} "runAs" should be an object with an "organizationId".`, {
      received: runAs,
      configKey,
      checkSlug: 'tenant',
    });
  }
  const operator = findForbiddenOperator(runAs.organizationId);
  if (operator) {
    throw new ConfigError(
      `${location} "runAs.organizationId" reads "${operator}" — the organization a routine runs as can not come from the caller. A browser or an API client controls the payload, so any caller could name another organization and read its rows. Derive it from a previous step (_step), from the caller (_user), or from a secret or environment value.`,
      { received: runAs.organizationId, configKey, checkSlug: 'tenant' }
    );
  }
}

export default validateRunAs;
