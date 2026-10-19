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

import { serializer } from '@lowdefy/helpers';

// The tenant facts buildConnections computed for page requests and steps
// (validateTenantPipelineEntry, validateSharedPipelineWrite): the scoped
// connection ids, the walled collections and the shared connections that could
// write into them. Dev page builds run later, one page at a time, against a
// fresh context, so the skeleton build (shallowBuild) writes them next to
// connectionIds.json and the dev server restores them (restoreTenantTargets).
// Always written, empty under pinned.
async function writeTenantTargets({ context }) {
  await context.writeBuildArtifact(
    'tenantTargets.json',
    serializer.serializeToString({
      tenantConnectionIds: [...context.tenantConnectionIds].sort(),
      walledTargets: [...context.walledTargets],
      sharedTargets: [...context.sharedTargets],
    })
  );
}

export default writeTenantTargets;
