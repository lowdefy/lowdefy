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

// Org-scoped steps default an omitted organizationId to the deployment's
// pinned organization - the org the engine ensures by slug at startup. An
// explicit organizationId always wins (what a multi-tenant admin module
// passes). Under the "tenant" policy there is no single implied org, so an
// omitted organizationId is a runtime error naming the fix.
function resolveOrganizationId({ organization, organizationId, step }) {
  if (!type.isNone(organizationId)) {
    return organizationId;
  }
  if (organization?.policy === 'tenant') {
    throw new Error(
      `${step} requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.`
    );
  }
  if (type.isNone(organization?.pinned?.id)) {
    throw new Error(
      `${step} could not default "organizationId" - the pinned organization is not resolved. Set organizationId on the step properties, or check that auth organizations are configured and the database is reachable.`
    );
  }
  return organization.pinned.id;
}

export default resolveOrganizationId;
