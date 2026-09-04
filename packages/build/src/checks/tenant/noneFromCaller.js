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
import collectTaintedStateKeys from './collectTaintedStateKeys.js';
import collectWalledSites from './collectWalledSites.js';
import findCallerReferences from './findCallerReferences.js';
import findTenantField from './findTenantField.js';

// F3: a `tenant: none` site whose authored tenant value comes from the
// caller. The payload is controlled by whoever makes the request, so an
// organization id taken from it is any organization the caller cares to name -
// exactly the leak the wall exists to prevent, re-opened by hand.
//
// `_state` is not the payload. It is `{}` for a page request (reported by the
// request-state-empty rule, which is a silent-failure bug rather than a leak)
// and server-authored for a routine step, where only a `:set_state` write that
// reaches the payload makes it caller-controlled - see collectTaintedStateKeys.
//
// Literal config only: the rule inspects the values authored at the tenant
// field key. A value composed by some other operator (_if, _get, ...) that
// itself reaches into the payload deeper than the walk looks is not
// reported, and a site whose filter is an operator node has no literal key
// to inspect and is skipped.
const FIX =
  'Derive it from a previous step (_step), the caller (_user), or scope the step with runAs.';

function taintedStateReference({ references, site }) {
  if (site.kind !== 'step') return null;
  const tainted = collectTaintedStateKeys(site.routine);
  return (
    references.find((reference) => {
      if (reference.operator !== '_state') return false;
      // A computed state path reads a key this walk can not name, so what
      // wrote it is unknowable.
      if (type.isNone(reference.path)) return true;
      return tainted.has(reference.path.split('.')[0]);
    }) ?? null
  );
}

function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant !== 'none') return;
    const { values } = findTenantField({ value: site.properties, field: site.field });
    const references = values.flatMap(findCallerReferences);
    const payload = references.find((reference) => reference.operator === '_payload');
    if (payload) {
      collectExceptions(
        context,
        new ConfigError(
          `${site.location} declares "tenant: none" and takes "${site.field}" from "_payload". The caller controls the payload, so any caller could read another organization's rows. ${FIX}`,
          { configKey: site.configKey, checkSlug: 'tenant-caller-source' }
        )
      );
      return;
    }
    const state = taintedStateReference({ references, site });
    if (!state) return;
    const key = type.isNone(state.path)
      ? 'a computed state path'
      : `state key "${state.path.split('.')[0]}"`;
    collectExceptions(
      context,
      new ConfigError(
        `${site.location} declares "tenant: none" and takes "${site.field}" from ${key}, which a ":set_state" step in this endpoint writes from the payload. The caller controls the payload, so any caller could read another organization's rows. ${FIX}`,
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
