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

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

// The oauth-provider's post-login seat: after login and before consent, the
// authorization server asks which organization the grant acts in. The answer
// is the consent referenceId - it keys consent per (client, user,
// organization), rides the authorization code and the refresh-token row, and
// is what customAccessTokenClaims stamps onto every access token as
// organization_id. So the organization an MCP token acts in is never a URL
// segment or a client-supplied parameter: it is the member's own choice,
// signed into the code by the AS and re-verified against the live member row
// on every request.
//
// Under the tenant policy the member chooses on the configured page (the page
// runs SetActiveOrganization for the chosen organization, then OAuthContinue),
// and the choice is made on every authorization - a one-organization member
// sees a single preselected row. The plugin asks shouldRedirect on every
// authorize call, including the one /oauth2/continue re-enters with after the
// choice, and only its CONSENT redirect carries the "post-login done" marker
// (ba_pl) - so an unconditional true would loop back to the picker forever.
// The request hook on /oauth2/continue (createOauthPostLoginHook) stamps the
// session object cached on that request instead, and shouldRedirect reads the
// stamp: true until the choice has been posted, false on the authorize call
// that carries it. Under the pinned policy there is one organization and
// nothing to choose: the redirect is skipped and the reference is the pinned
// organization, whose id is its slug. The page is still required by the
// plugin option shape, so the consent page stands in - it is never redirected
// to.
//
// The marker lives on the in-request session object only - never persisted -
// so it cannot outlive the request that made the choice.
const OAUTH_POST_LOGIN_CONFIRMED = 'oauthPostLoginConfirmed';

function buildOauthPostLogin({ authConfig, baseUrlOrigin, basePath }) {
  if (authConfig.organizations?.policy === 'pinned') {
    return {
      page: `${baseUrlOrigin}${basePath}${authConfig.oauthProvider.consentPage}`,
      shouldRedirect: () => false,
      consentReferenceId: () => authConfig.organizations.org,
    };
  }
  return {
    page: `${baseUrlOrigin}${basePath}${authConfig.oauthProvider.postLoginPage}`,
    shouldRedirect: ({ session }) => session?.[OAUTH_POST_LOGIN_CONFIRMED] !== true,
    consentReferenceId: ({ session }) => {
      const organizationId = session?.activeOrganizationId;
      // The plugin's contract: fail here when the reference is missing rather
      // than let a consent be recorded without one - a token minted without
      // organization_id would be refused by the MCP route on every call.
      if (!type.isString(organizationId) || organizationId.length === 0) {
        throw new APIError('BAD_REQUEST', {
          error: 'invalid_request',
          error_description:
            'No organization was selected for this authorization. Choose an organization and try again.',
        });
      }
      return organizationId;
    },
  };
}

export { OAUTH_POST_LOGIN_CONFIRMED };
export default buildOauthPostLogin;
