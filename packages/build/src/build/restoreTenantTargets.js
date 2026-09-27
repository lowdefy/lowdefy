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

// Restores the tenantTargets.json skeleton artifact (writeTenantTargets) onto a
// dev page build context, so page requests get the same tenant checks in dev
// as in a full build.
function restoreTenantTargets({ context, tenantTargets }) {
  context.tenantConnectionIds = new Set(tenantTargets.tenantConnectionIds);
  context.walledTargets = new Map(tenantTargets.walledTargets);
  context.sharedTargets = new Map(tenantTargets.sharedTargets);
}

export default restoreTenantTargets;
