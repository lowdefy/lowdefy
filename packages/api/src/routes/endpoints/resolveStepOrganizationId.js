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

// The one place an org-scoped auth step's target organization is decided. The
// floor authorizes against the result and the step writes into it, so a second
// resolution anywhere else would not crash - it would silently authorize
// organization A while the step writes into organization B.
//
// An explicit organizationId always wins: that is what a multi-organization
// admin module passes, and it is what lets a session pinned to the team
// organization administer the customer organization. A slug (only ListMembers
// accepts one) is an explicit selection too, and is resolved to an id here so
// the authorized organization and the listed organization are the same one.
// Otherwise the deployment's pinned organization is the default - under the
// "tenant" policy there is no single implied organization, so an omitted
// organizationId is a runtime error naming the fix.
async function resolveStepOrganizationId({ auth, configKey, organization, properties, stepId }) {
  if (!type.isNone(properties?.organizationId)) {
    return properties.organizationId;
  }
  if (!type.isNone(properties?.organizationSlug)) {
    const { adapter } = await auth.$context;
    const found = await adapter.findOne({
      model: 'organization',
      where: [{ field: 'slug', value: properties.organizationSlug }],
    });
    if (type.isNone(found)) {
      throw new ConfigError(
        `Auth step "${stepId}" found no organization with slug "${properties.organizationSlug}".`,
        { configKey }
      );
    }
    return found.id;
  }
  if (organization?.policy === 'tenant') {
    throw new ConfigError(
      `Auth step "${stepId}" requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.`,
      { configKey }
    );
  }
  if (type.isNone(organization?.pinned?.id)) {
    throw new ConfigError(
      `Auth step "${stepId}" could not default "organizationId" - the pinned organization is not resolved. Set organizationId on the step properties, or check that auth organizations are configured and the database is reachable.`,
      { configKey }
    );
  }
  return organization.pinned.id;
}

export default resolveStepOrganizationId;
