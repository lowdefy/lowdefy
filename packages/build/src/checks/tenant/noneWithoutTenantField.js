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

import collectExceptions from '../../utils/collectExceptions.js';
import collectWalledSites from './collectWalledSites.js';
import findTenantField from './findTenantField.js';

// F2: a `tenant: none` site that never mentions the tenant field. With the
// wall off and no authored clause, the request reads (or writes) every
// organization's rows - the one shape `tenant: none` is almost never meant
// to have.
//
// Literal config only: the field may be introduced by an operator the walk
// can not see, so a site whose properties contain an operator node and no
// literal mention is skipped rather than reported.
function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant !== 'none') return;
    const { found, unknown } = findTenantField({ value: site.properties, field: site.field });
    if (found || unknown) return;
    collectExceptions(
      context,
      new ConfigError(
        `${site.location} declares "tenant: none" on tenant connection "${site.connectionId}" but never mentions "${site.field}". It reads every organization's rows. Scope the endpoint with runAs: { organizationId: … }, or author an "${site.field}" clause in its properties.`,
        { configKey: site.configKey, checkSlug: 'tenant-unscoped' }
      )
    );
  });
}

const noneWithoutTenantField = {
  slug: 'tenant-unscoped',
  checkOnly: true,
  run,
};

export default noneWithoutTenantField;
