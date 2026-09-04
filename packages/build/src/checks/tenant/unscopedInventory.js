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
import { ConfigWarning } from '@lowdefy/errors';

import collectWalledSites from './collectWalledSites.js';

// R1: the `tenant: none` inventory. Every site that runs with the wall off is
// listed, one warning per site so each carries its own source location.
// There is deliberately no reason field and no allowlist - a reason is prose
// the checker can not verify, and an allowlist is bookkeeping the inventory
// replaces. The record is the warning; runAs is the fix.
//
// Literal config only in the same sense as the other tenant rules: the
// sentinel itself is always literal, so nothing here is skipped.
function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant !== 'none') return;
    context.handleWarning(
      new ConfigWarning(
        `${site.location} runs unscoped on tenant connection "${site.connectionId}" (tenant: none). Prefer runAs: { organizationId: … }, which keeps the wall on.`,
        { configKey: site.configKey, checkSlug: 'tenant-inventory' }
      )
    );
  });
}

const unscopedInventory = {
  slug: 'tenant-inventory',
  checkOnly: true,
  run,
};

export default unscopedInventory;
