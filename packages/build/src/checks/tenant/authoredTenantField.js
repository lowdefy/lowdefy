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

import collectAuthoredPositions from './collectAuthoredPositions.js';
import collectExceptions from '../../utils/collectExceptions.js';
import collectWalledSites from './collectWalledSites.js';
import findTenantField from './findTenantField.js';

// F1: a walled site authors the tenant field itself. The wall injects the
// caller's organization on every read and write and refuses an authored
// value at runtime, so the clause is at best redundant and at worst a
// refused request in production. Failing at build is strictly earlier than
// the runtime refusal, so this rule is not checkOnly.
//
// Literal config only: a filter or document composed by an operator is
// invisible to a static walk, so a site whose value is an operator node is
// skipped rather than guessed at (the wall still refuses it at runtime).
//
// The scan covers the positions the runtime refuses and no others
// (collectAuthoredPositions): reading the tenant field - a projection, a sort,
// a $group key - is legitimate and must not fail a build.
function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant === 'none' || site.tenant === 'authored') return;
    const found = collectAuthoredPositions({ properties: site.properties }).some(
      (value) => findTenantField({ value, field: site.field }).found
    );
    if (!found) return;
    collectExceptions(
      context,
      new ConfigError(
        `${site.location} sets "${site.field}" itself on tenant connection "${site.connectionId}". The wall injects it — an authored value is refused at runtime. Remove the clause; the caller's organization is applied automatically.`,
        { configKey: site.configKey, checkSlug: 'tenant-authored' }
      )
    );
  });
}

const authoredTenantField = {
  slug: 'tenant-authored',
  checkOnly: false,
  run,
};

export default authoredTenantField;
