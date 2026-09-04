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

// `runAs` supersedes `tenant: none` on requests and request steps: it keeps
// the wall on and names the scope, where `tenant: none` takes the wall off and
// leaves the organization clause to be hand-written in every filter and
// document. Two ways to say "this runs outside a caller's session" is one too
// many, and only one of them is safe by construction - so every `tenant: none`
// declaration is a deprecation warning in v8 and is removed in v9.
//
// Websockets are exempt: a change stream is scoped mechanically and has no
// `runAs` form, so `tenant: none` stays their only opt-out. They are not in
// collectWalledSites, which walks page requests and routine steps only.
function run({ components, context }) {
  collectWalledSites({ components, context }).forEach((site) => {
    if (site.tenant !== 'none') return;
    context.handleWarning(
      new ConfigWarning(
        `${site.location} declares "tenant: none", which is deprecated and is removed in v9. Declare runAs: { organizationId: … } on the endpoint instead - it keeps the tenant wall on and names the organization the routine runs as, where "tenant: none" switches the wall off.`,
        { configKey: site.configKey, checkSlug: 'tenant-none-deprecated' }
      )
    );
  });
}

const noneSupersededByRunAs = {
  slug: 'tenant-none-deprecated',
  checkOnly: false,
  run,
};

export default noneSupersededByRunAs;
