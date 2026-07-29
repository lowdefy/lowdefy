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

import React, { useEffect, useRef } from 'react';
import { createAuthClient } from 'better-auth/react';
import {
  adminClient,
  genericOAuthClient,
  magicLinkClient,
  organizationClient,
  phoneNumberClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

import { serializer } from '@lowdefy/helpers';

import rawLowdefyConfig from '../../../build/config.json';

const lowdefyConfig = serializer.deserialize(rawLowdefyConfig);

const authClient = createAuthClient({
  baseURL: `${window.location.origin}${lowdefyConfig.basePath ?? ''}/api/auth`,
  plugins: [
    adminClient(),
    genericOAuthClient(),
    magicLinkClient(),
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
// kept in a ref: while the session user is unchanged it stays authoritative
// for the fields the session does not carry, and UpdateSession refreshes the
// ref from /api/user after a change (e.g. SetActiveOrganization).
function Session({ children, reloadSuppressedRef, serverUser }) {
  const { data: session, isPending } = authClient.useSession();
  const resolvedUserRef = useRef(serverUser);
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
    return children(resolvedUserRef.current, resolvedUserRef);
  }
  if (!session?.user) {
    return children(null, resolvedUserRef);
  }
  const resolved = resolvedUserRef.current;
  if (!resolved) {
    return children({ roles: [], ...session.user }, resolvedUserRef);
  }
  if (resolved.id !== session.user.id) {
    // The ref has not caught up with a changed session user (an impersonation
    // switch between the session refetch and the /api/user result). Render
    // the last resolved caller rather than a caller with no roles - blocks
    // re-evaluate operators on render, so a role-guarded page would act on
    // roles: []. UpdateSession closes the window when it lands the new
    // caller; a flow that swaps the session user without chaining it leaves
    // the previous caller rendered until the next page load.
    return children(resolved, resolvedUserRef);
  }
  // The resolved caller contributes every field the session user lacks: roles
  // (the active member row), attributes (the merged bag), and
  // activeOrganizationId / impersonatedBy (session row, not session user).
  // impersonatedBy is carried only when present, matching the server, which
  // omits it rather than setting it to undefined.
  const user = {
    ...session.user,
    roles: resolved.roles,
    attributes: resolved.attributes,
    activeOrganizationId: resolved.activeOrganizationId,
    ...('impersonatedBy' in resolved ? { impersonatedBy: resolved.impersonatedBy } : {}),
  };
  return children(user, resolvedUserRef);
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
    cancelInvitation: (params) => authClient.organization.cancelInvitation(params),
    changePassword: (params) => authClient.changePassword(sessionScoped(params)),
    deletePasskey: (params) => authClient.passkey.deletePasskey(params),
    impersonateUser: (params) => authClient.admin.impersonateUser(sessionScoped(params)),
    inviteMember: (params) => authClient.organization.inviteMember(params),
    leaveOrganization: (params) => authClient.organization.leave(sessionScoped(params)),
    phoneNumberRequestPasswordReset: (params) =>
      authClient.phoneNumber.requestPasswordReset(params),
    phoneNumberResetPassword: (params) => authClient.phoneNumber.resetPassword(params),
    phoneNumberSendOtp: (params) => authClient.phoneNumber.sendOtp(params),
    phoneNumberVerify: (params) => authClient.phoneNumber.verify(params),
    removeMember: (params) => authClient.organization.removeMember(sessionScoped(params)),
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
    stopImpersonating: () => authClient.admin.stopImpersonating(sessionScoped()),
    twoFactorDisable: (params) => authClient.twoFactor.disable(sessionScoped(params)),
    twoFactorEnable: (params) => authClient.twoFactor.enable(sessionScoped(params)),
    twoFactorVerifyBackupCode: (params) => authClient.twoFactor.verifyBackupCode(params),
    twoFactorVerifyTotp: (params) => authClient.twoFactor.verifyTotp(params),
    updateMemberRole: (params) => authClient.organization.updateMemberRole(params),
    updateOrganization: (params) => authClient.organization.update(params),
  };
  return (
    <Session reloadSuppressedRef={reloadSuppressedRef} serverUser={serverUser}>
      {(user, resolvedUserRef) => {
        auth.user = user;
        auth.updateResolvedUser = (resolved) => {
          resolvedUserRef.current = resolved;
        };
        return children(auth);
      }}
    </Session>
  );
}

export default AuthConfigured;
