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

import { betterAuth } from 'better-auth';

import ensureOrganization from './organizations/ensureOrganization.js';
import getBetterAuthConfig from './getBetterAuthConfig.js';
import { getMcpUriPrefix } from '../mcp/getMcpUri.js';
import { registerAuthEnforcement } from './getAuthEnforcement.js';
import { registerMcpResourceBinding } from '../mcp/getMcpResourceBinding.js';
import { registerOrganizationBinding } from './organizations/getOrganizationBinding.js';

let instance;

// The BetterAuth instance is constructed once per process at first use -
// it handles /api/auth/* and resolves sessions for every request.
// The engine-tier hooks receive a getAuth accessor instead of the instance
// itself - they fire only after construction completes, so the lazy
// reference is always resolved by then.
function getBetterAuth({
  appMeta,
  authJson,
  config,
  createSystemContext,
  dev,
  logger,
  plugins,
  secrets,
}) {
  if (instance) return instance;
  instance = betterAuth(
    getBetterAuthConfig({
      appMeta,
      authJson,
      config,
      createSystemContext,
      dev,
      getAuth: () => instance,
      logger,
      plugins,
      secrets,
    })
  );

  // The build-time authorization facts the gates read - the enrolment floor, the
  // one page exempt from it, and the protection an unlisted page id inherits.
  registerAuthEnforcement({ auth: instance, authJson });

  // Retain the organizations declaration per instance - request-time reads
  // (the _organization operator, step organizationId defaulting) resolve the
  // policy and the ensured pinned org from it.
  if (authJson.organizations) {
    registerOrganizationBinding({
      auth: instance,
      database: Boolean(authJson.database),
      organizations: authJson.organizations,
    });
  }

  // Retain the MCP resource URI prefix per instance - the /api/mcp/:org
  // bearer-token guard reads it to test token audiences against the
  // deployment's canonical prefix. getBetterAuthConfig has already failed
  // startup when BETTER_AUTH_URL is unset, so the prefix resolves here.
  if (authJson.oauthProvider) {
    registerMcpResourceBinding({ auth: instance, uriPrefix: getMcpUriPrefix({ config }) });
  }

  // Ensure the pinned organization exists at startup - created if missing,
  // untouched otherwise. The engine hooks await the same memoized ensure per
  // fire, so a failure here only defers seeding to the first sign-in. A
  // strategies-only app has no database - seeding an in-memory org would be
  // meaningless, and no session user can ever reach the membership wall.
  if (authJson.organizations?.policy === 'pinned' && authJson.database) {
    ensureOrganization({ auth: instance, slug: authJson.organizations.org }).catch((error) => {
      logger.warn(
        { err: error },
        `Failed to ensure the pinned organization "${authJson.organizations.org}" at startup.`
      );
    });
  }

  return instance;
}

export default getBetterAuth;
