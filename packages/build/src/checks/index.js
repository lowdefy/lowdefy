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

import jsLint from './jsLint.js';
import tenantRules from './tenant/index.js';
import collectionsRules from './collections/index.js';
import secretsRules from './secrets/index.js';
import layoutRules from './layout/index.js';
import filePluginRules from './filePlugins/index.js';

// The single place a check rule is registered. A rule is
// { slug, checkOnly, run({ components, context }) } and reports through
// collectExceptions / context.handleWarning like every other build step.
// checkOnly rules run under `lowdefy check` only; the rest also fail builds.
const rules = [
  jsLint,
  ...tenantRules,
  ...collectionsRules,
  ...secretsRules,
  ...layoutRules,
  ...filePluginRules,
];

function runChecks({ components, context }) {
  for (const rule of rules) {
    if (rule.checkOnly && !context.validateOnly) continue;
    rule.run({ components, context });
  }
  return components;
}

export { rules };

export default runChecks;
