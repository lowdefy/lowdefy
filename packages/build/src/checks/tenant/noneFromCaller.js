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

import collectExceptions from '../../utils/collectExceptions.js';
import collectWalledSites from './collectWalledSites.js';
import findTenantField from './findTenantField.js';

const CALLER_OPERATORS = ['_payload', '_state'];

// The operator key a value subtree takes its data from, when that source is
// the caller: `_payload`, `_state`, or the dotted shorthand `_payload.org_id`.
function findCallerOperator(value) {
  if (type.isArray(value)) {
    for (const item of value) {
      const operator = findCallerOperator(item);
      if (operator) return operator;
    }
    return null;
  }
  if (!type.isObject(value)) {
    return null;
  }
  for (const key of Object.keys(value)) {
    const operator = CALLER_OPERATORS.find(
      (candidate) => key === candidate || key.startsWith(`${candidate}.`)
    );
    if (operator) return operator;
    const nested = findCallerOperator(value[key]);
    if (nested) return nested;
  }
  return null;
}

// F3: a `tenant: none` site whose authored tenant value comes from the
// caller. The payload and the page state are both controlled by whoever
// makes the request, so an organization id taken from them is any
// organization the caller cares to name - exactly the leak the wall exists
// to prevent, re-opened by hand.
//
// Literal config only: the rule inspects the values authored at the tenant
// field key. A value composed by some other operator (_if, _get, ...) that
// itself reaches into the payload deeper than the walk looks is not
// reported, and a site whose filter is an operator node has no literal key
// to inspect and is skipped.
function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant !== 'none') return;
    const { values } = findTenantField({ value: site.properties, field: site.field });
    const operator = values.map(findCallerOperator).find((found) => found !== null);
    if (!operator) return;
    collectExceptions(
      context,
      new ConfigError(
        `${site.location} declares "tenant: none" and takes "${
          site.field
        }" from "${operator}". The caller controls the ${
          operator === '_payload' ? 'payload' : 'state'
        }, so any caller could read another organization's rows. Derive it from a previous step (_step), the caller (_user), or scope the step with runAs.`,
        { configKey: site.configKey, checkSlug: 'tenant-caller-source' }
      )
    );
  });
}

const noneFromCaller = {
  slug: 'tenant-caller-source',
  checkOnly: true,
  run,
};

export default noneFromCaller;
