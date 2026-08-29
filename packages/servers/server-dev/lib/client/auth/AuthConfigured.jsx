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

import React, { useEffect, useRef, useState } from 'react';
import { createAuthClient } from 'better-auth/react';
import {
  adminClient,
  magicLinkClient,
  organizationClient,
  phoneNumberClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';
import { passkeyClient } from '@better-auth/passkey/client';

import { normalizeCaller, serializer } from '@lowdefy/helpers';

import rawLowdefyConfig from '../../../build/config.json';

const lowdefyConfig = serializer.deserialize(rawLowdefyConfig);

// GenericOAuth providers have no client plugin here. BetterAuth 1.7.0 dropped
// genericOAuthClient from better-auth/client/plugins, and nothing replaces it:
// through 1.6.x it was a marker plugin carrying only an id, a version, an empty
// $InferServerPlugin for TypeScript inference, and the generic-oauth error
// codes - no actions, atoms, fetch plugins or path methods. signIn.oauth2 is
// resolved by the client's dynamic path proxy from the call itself
// (signIn.oauth2 -> POST /sign-in/oauth2, POST because providerId is always
// sent), so the sign-in a Lowdefy GenericOAuth provider makes is unaffected.
const authClient = createAuthClient({
  baseURL: `${window.location.origin}${lowdefyConfig.basePath ?? ''}/api/auth`,
  plugins: [
    adminClient(),
    magicLinkClient(),
    oauthProviderClient(),
    organizationClient(),
    passkeyClient(),
    phoneNumberClient(),
    twoFactorClient(),
  ],
});

// UpdateSession owns session freshness - suppress BetterAuth's own
// signal-driven refetch on the calls that would otherwise fire one, so
// nothing competes with (and aborts) the refetch UpdateSession awaits.
// Only calls that mutate an existing session are suppressed - calls that
// can establish one (the sign-ins, and the two-factor, phone-number and
// passkey verifies) keep their signal: its refetch is what makes the store
// notice a login when no navigation follows.
// disableSignal silences all atomListeners for the call, including the
// organization plugin's org atoms - none are exposed to app config, so a
// future design exposing one must refresh it through its own action.
const sessionScoped = (params) => ({
  ...params,
  fetchOptions: { ...params?.fetchOptions, disableSignal: true },
});

// The server resolves the caller per request and embeds it in the page
// config, so the first render never flashes unauthenticated. The BetterAuth
// client store takes over once its session fetch settles.
//
// Roles and merged attributes resolve server-side from the active member row
// - the base session carries neither. The last server-resolved caller is
// held in state: while the session user is unchanged it stays authoritative
// for the fields the session does not carry, and UpdateSession refreshes it
// from /api/user after a change (e.g. SetActiveOrganization). Holding it in
// state, not a ref, re-renders Session when it changes so _user recomputes -
// the same reactive footing the session half already stands on.
//
// Only the session half is passed through normalizeCaller. BetterAuth's store
// returns camelCase keys whatever the columns are named, so untransformed it
// would sit emailVerified beside the resolved caller's email_verified on one
// object; anything arriving from the server is already snake_case.
function Session({ children, reloadSuppressedRef, serverUser }) {
  const { data: session, isPending } = authClient.useSession();
  const [resolvedUser, setResolvedUser] = useState(serverUser);
  const wasAuthenticated = useRef(Boolean(serverUser));

  useEffect(() => {
    if (session) {
      wasAuthenticated.current = true;
    }
    // Reload after sign-out (or session revocation) so the server can apply
    // the page auth fork - a protected page redirects to the login page.
    // A logout with a callbackUrl suppresses the reload - its own navigation
    // would otherwise race this one.
    if (wasAuthenticated.current && !isPending && !session && !reloadSuppressedRef.current) {
      window.location.reload();
    }
  }, [session, isPending]);

  if (isPending) {
    return children(resolvedUser, setResolvedUser);
  }
  if (!session?.user) {
    return children(null, setResolvedUser);
  }
  const resolved = resolvedUser;
  if (!resolved) {
    return children({ roles: [], ...normalizeCaller(session.user) }, setResolvedUser);
  }
  if (resolved.id !== session.user.id) {
    // The ref has not caught up with a changed session user - a sign-in as a
    // different person lands between the session refetch and the /api/user
    // result. Render the last resolved caller whole rather than mixing the new
    // session user with the previous person's resolved fields, or falling back
    // to a caller with no roles - blocks re-evaluate operators on render, so a
    // role-guarded page would act on an empty role list. UpdateSession closes
    // the window when it lands the new caller; a flow that changes the session
    // user without chaining it leaves the previous caller rendered until the
    // next page load.
    return children(resolved, setResolvedUser);
  }
  // _user is one object with one meaning on both sides: the resolved caller is
  // spread whole, so every field resolveAuthentication emits is readable in app
  // config without this file naming it. session.user is the floor - the client
  // store may hold a fresher one than the resolved state, and the resolved
  // object wins wherever both carry a key.
  const user = { ...normalizeCaller(session.user), ...resolved };
  return children(user, setResolvedUser);
}

function AuthConfigured({ authConfig, children, serverUser }) {
  const reloadSuppressedRef = useRef(false);
  const auth = {
    authConfig,
    getSession: ({ disableCookieCache } = {}) =>
      authClient.getSession(disableCookieCache ? { query: { disableCookieCache: true } } : {}),
    // Refetches the session through the session atom - the store's only
    // writer - and resolves only after the store is written. fetchSession
    // returns undefined and never rejects (failures are written into the
    // atom), so the atom's own { data, error } is read back and returned,
    // keeping unwrap working and surfacing a failed refresh to the action.
    refreshSession: async ({ disableCookieCache } = {}) => {
      const sessionAtom = authClient.$store.atoms.session;
      await sessionAtom
        .get()
        .refetch(disableCookieCache ? { query: { disableCookieCache: true } } : undefined);
      const { data, error } = sessionAtom.get();
      return { data, error };
    },
    // The server-resolved caller - roles from the active member row and the
    // merged attributes bag - for re-syncing after session changes.
    getResolvedUser: async () => {
      const response = await fetch(`${lowdefyConfig.basePath ?? ''}/api/user`, {
        credentials: 'same-origin',
      });
      if (!response.ok) {
        // /api/user itself always answers 200 { user } - user: null when no
        // caller is admitted, which updateSession branches on. A non-OK
        // response is a transport failure (gateway error page, 5xx) with no
        // parsable body.
        throw new Error(`Failed to fetch the resolved user (HTTP ${response.status}).`);
      }
      return response.json();
    },
    suppressSignOutReload: () => {
      reloadSuppressedRef.current = true;
    },
    acceptInvitation: (params) => authClient.organization.acceptInvitation(sessionScoped(params)),
    // addPasskey runs the WebAuthn browser ceremony itself - options fetch,
    // authenticator prompt, verification.
    addPasskey: (params) => authClient.passkey.addPasskey(params),
    changePassword: (params) => authClient.changePassword(sessionScoped(params)),
    deletePasskey: (params) => authClient.passkey.deletePasskey(params),
    updatePasskey: (params) => authClient.passkey.updatePasskey(params),
    leaveOrganization: (params) => authClient.organization.leave(sessionScoped(params)),
    // The caller's memberships from the org plugin, keyed on the session
    // alone - not the active organization. sessionScoped so the list read
    // does not also fire the org-list atom's own refetch of the same route.
    listOrganizations: () => authClient.organization.list(sessionScoped()),
    // POST /oauth2/consent. The signed authorization query is not passed
    // here - the oauthProviderClient fetch plugin stamps it onto the body as
    // oauth_query from window.location.search, so the call must run while
    // the page still holds the query the oauth-provider redirect arrived
    // with.
    oauth2Consent: (params) => authClient.oauth2.consent(params),
    // POST /oauth2/continue - resumes the authorization after the post-login
    // organization choice (the page runs SetActiveOrganization first). Same
    // oauth_query contract as oauth2Consent: the signed query rides from
    // window.location.search, so the call must run before any navigation.
    oauth2Continue: (params) => authClient.oauth2.continue(params),
    phoneNumberRequestPasswordReset: (params) =>
      authClient.phoneNumber.requestPasswordReset(params),
    phoneNumberResetPassword: (params) => authClient.phoneNumber.resetPassword(params),
    phoneNumberSendOtp: (params) => authClient.phoneNumber.sendOtp(params),
    phoneNumberVerify: (params) => authClient.phoneNumber.verify(params),
    requestPasswordReset: (params) => authClient.requestPasswordReset(params),
    resetPassword: (params) => authClient.resetPassword(params),
    revokeOtherSessions: () => authClient.revokeOtherSessions(sessionScoped()),
    sendVerificationEmail: (params) => authClient.sendVerificationEmail(params),
    setActiveOrganization: (params) => authClient.organization.setActive(sessionScoped(params)),
    signInEmail: (params) => authClient.signIn.email(params),
    signInMagicLink: (params) => authClient.signIn.magicLink(params),
    signInOauth2: (params) => authClient.signIn.oauth2(params),
    signInPasskey: (params) => authClient.signIn.passkey(params),
    signInPhoneNumber: (params) => authClient.signIn.phoneNumber(params),
    signInSocial: (params) => authClient.signIn.social(params),
    signOut: () => authClient.signOut(),
    signUpEmail: (params) => authClient.signUp.email(params),
    twoFactorDisable: (params) => authClient.twoFactor.disable(sessionScoped(params)),
    twoFactorEnable: (params) => authClient.twoFactor.enable(sessionScoped(params)),
    twoFactorGenerateBackupCodes: (params) =>
      authClient.twoFactor.generateBackupCodes(sessionScoped(params)),
    twoFactorVerifyBackupCode: (params) => authClient.twoFactor.verifyBackupCode(params),
    twoFactorVerifyTotp: (params) => authClient.twoFactor.verifyTotp(params),
  };
  return (
    <Session reloadSuppressedRef={reloadSuppressedRef} serverUser={serverUser}>
      {(user, setResolvedUser) => {
        auth.user = user;
        auth.updateResolvedUser = (resolved) => setResolvedUser(resolved);
        return children(auth);
      }}
    </Session>
  );
}

export default AuthConfigured;
