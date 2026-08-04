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

import { getHomePathname, stopChain } from '@lowdefy/engine';
import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

function getCallbackUrl({ lowdefy, callbackUrl, name = 'callbackUrl' }) {
  // An absent target means "no target" - the ladder in resolveCallbackURL
  // decides what absence falls back to. null is absence too: an operator with no
  // matching branch (an `_if` without an `else`) resolves to null, and
  // destructuring that throws a TypeError instead of falling to the default.
  //
  // A non-object target - notably the bare string these params were wrongly
  // declared as before the schemas were corrected - expresses none of the four
  // keys below and so resolves to no target, letting the ladder continue. It is
  // deliberately not an error: apps written against the old string schema are
  // common, and the two better-looking alternatives are both worse. Throwing
  // fails a sign-in that works today, and reading a string as { url } would
  // double-prefix basePath on the most common spelling of all, a string holding
  // the already-prefixed ?callbackUrl= query.
  if (!type.isObject(callbackUrl)) {
    return undefined;
  }
  const { home, pageId, urlQuery, url } = callbackUrl;

  const targets = [home, pageId, url].filter((target) => target);
  if (targets.length > 1) {
    throw new Error(
      `Invalid ${name}: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined.`
    );
  }
  const query = type.isNone(urlQuery) ? '' : `${urlQueryFn.stringify(urlQuery)}`;

  if (home === true) {
    // An app whose home config names no page has no resolvable home - return no
    // target rather than interpolating the missing pageId into the path.
    // getHomeAndMenus resolves pageId to null when there is no homePageId and no
    // menu link to fall back on, which built the literal "/null".
    const pathname = getHomePathname({ lowdefy });
    if (type.isNone(pathname)) {
      return undefined;
    }
    return `${pathname}${query ? `?${query}` : ''}`;
  }
  if (type.isString(pageId)) {
    return `/${pageId}${query ? `?${query}` : ''}`;
  }
  if (type.isString(url)) {
    return `${url}${query ? `?${query}` : ''}`;
  }

  return undefined;
}

// Resolves a structured target ({ home, pageId, urlQuery, url }) to a URL,
// prefixing basePath onto app-relative paths - an absolute url target passes
// through unchanged (external landing pages). Returns undefined when the
// target is empty. Shared by callbackUrl and its magic-link/social siblings
// so basePath handling lives in one place. Off-site safety for the resolved
// URL is BetterAuth's server-side originCheck / trustedOrigins, not here.
function resolveTargetURL({ lowdefy, callbackUrl, name }) {
  const explicit = getCallbackUrl({ lowdefy, callbackUrl, name });
  if (type.isNone(explicit)) {
    return undefined;
  }
  if (explicit.startsWith('/')) {
    return `${lowdefy.basePath ?? ''}${explicit}`;
  }
  return explicit;
}

// Accepts only a path-absolute URL from the ?callbackUrl= query. A bare
// startsWith('/') is not enough: "//evil.com" and "/\evil.com" also start with
// "/" but are protocol-relative (browsers normalize the backslash to a slash),
// so a crafted sign-in link would navigate off-site with a fresh session. This
// value is the one target that never reaches BetterAuth on the email, phone and
// passkey paths - it goes straight into window.location.assign - so its
// server-side originCheck / trustedOrigins do not cover it.
function isAppRelativePath(value) {
  return type.isString(value) && /^\/([^/\\]|$)/.test(value);
}

// The engine owns the two-factor challenge destination on every sign-in path, so
// every method that can receive a challenge instead of a session navigates
// through here. Leaving it to the login page makes correctness opt-in: a page
// that omits the branch leaves an enrolled user unable to sign in at all and
// with nothing to show for the click. Routed through resolveTargetURL like every
// other destination so basePath handling stays in one place and an absolute
// authPages.twoFactor keeps its origin.
//
// The destination the user asked for travels with them: an enrolled user who
// deep-linked to /invoices/123 must not be dropped on the challenge page's
// default once the challenge is done. Only an app-relative path is carried - the
// challenge page is public and its query is attacker-suppliable, and
// isAppRelativePath is the guard that already rejects //evil.com and
// /\evil.com here.
//
// Returns false rather than throwing when there is no page to navigate to: the
// build check is what guarantees authPages.twoFactor exists whenever two-factor
// is enabled, and a throw here would turn that guarantee into a failed sign-in.
// The no-window case is legitimate too (server rendering, tests). The caller
// then falls through to returning the response without navigating.
function navigateToTwoFactorChallenge({ callbackURL, lowdefy, auth }) {
  const twoFactorPage = auth.authConfig?.authPages?.twoFactor;
  if (!type.isString(twoFactorPage)) {
    return false;
  }
  const target = resolveTargetURL({
    lowdefy,
    callbackUrl: { url: twoFactorPage },
    name: 'authPages.twoFactor',
  });
  const window = lowdefy._internal?.globals?.window;
  if (type.isNone(target) || !window) {
    return false;
  }
  // Parsed rather than concatenated: authPages.twoFactor may already carry a
  // query of its own, and searchParams encodes the callbackUrl value so one
  // holding a '&' or '?' survives. An app-relative page must not gain an origin
  // from being parsed against one, hence the round trip back to path + search.
  const url = new URL(target, window.location.origin);
  if (isAppRelativePath(callbackURL)) {
    url.searchParams.set('callbackUrl', callbackURL);
  }
  window.location.assign(
    url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.toString()
  );
  return true;
}

// The action's callbackUrl param wins; otherwise honor the callbackUrl query
// param set by the unauthenticated page redirect, so login returns to the
// page the user asked for; otherwise the app's home page. Only app-relative
// paths are accepted from the query to avoid open redirects. The query fallback
// is exclusive to the primary callbackUrl - a new-user or error destination has
// no equivalent query source, so reading it for them would misroute.
function resolveCallbackURL({ lowdefy, callbackUrl }) {
  // An explicit refusal to navigate, above the ladder so a bounced sign-in
  // honors it too. Absence means "go home" below, so "stay put" needs its own
  // spelling - a login form in a modal or an embedded panel relies on the
  // session store re-rendering the tree with the new user in place.
  if (callbackUrl === false) {
    return undefined;
  }
  const explicit = resolveTargetURL({ lowdefy, callbackUrl });
  if (!type.isNone(explicit)) {
    return explicit;
  }
  const window = lowdefy._internal?.globals?.window;
  const fromQuery = new URLSearchParams(window?.location?.search ?? '').get('callbackUrl');
  if (isAppRelativePath(fromQuery)) {
    // Returned raw, not through resolveTargetURL: both producers of this query
    // param already bake basePath into the value they emit (renderPage.js,
    // apiPage.js), so prefixing here would yield /app/app/reports.
    return fromQuery;
  }
  // The bottom rung, below the query so a bounced sign-in still returns to the
  // page the user asked for. Resolved through the same helper as the explicit
  // rung, so basePath handling stays in one place.
  const home = resolveTargetURL({ lowdefy, callbackUrl: { home: true } });
  if (!type.isNone(home)) {
    return home;
  }
  throw new Error(
    'Invalid callbackUrl: no destination resolved. The app has no resolvable home page - set homePageId, give an explicit callbackUrl, or use "callbackUrl: false" to stay on the page.'
  );
}

// callbackUrl: false suppresses Lowdefy's own window.location.assign, so it is
// only honorable where that assign is the value's single consumer. The paths
// that hand callbackURL to BetterAuth make it the destination of a later hop -
// an emailed link, an OAuth return - which cannot be suppressed once the browser
// has left. Both alternatives there are worse than an error: omitting the param
// lands the user on BetterAuth's own "/" fallback, which resolves against the
// auth baseURL and so drops basePath entirely, and silently substituting the
// home default contradicts an explicit instruction.
function assertCallbackUrlNavigable({ callbackUrl, method }) {
  if (callbackUrl === false) {
    throw new Error(
      `Invalid callbackUrl: "false" is not valid for ${method}, which redirects through an external hop. Give a destination.`
    );
  }
}

// Maps the captchaToken action param onto the BetterAuth client's per-call
// fetch options as the x-captcha-response header - the header the captcha
// middleware reads. One helper so no auth method implements its own header
// plumbing; the token never rides in the request body. Tokens are single-use
// and short-lived: a failed submit consumes the token, so retry chains reset
// the Captcha block for a fresh one.
function captchaFetchOptions(captchaToken) {
  if (type.isNone(captchaToken)) {
    return {};
  }
  return { fetchOptions: { headers: { 'x-captcha-response': captchaToken } } };
}

// BetterAuth client calls resolve with { data, error } instead of throwing -
// rethrow so action onError chains fire on failed sign-in attempts.
async function unwrap(promise) {
  const { data, error } = await promise;
  if (error) {
    const authError = new Error(error.message ?? error.statusText ?? 'Authentication failed.');
    authError.code = error.code;
    authError.status = error.status;
    throw authError;
  }
  return data;
}

function createAuthMethods(lowdefy, auth) {
  // login and logout are Lowdefy functions that handle action params;
  // the auth object provides the BetterAuth client methods.
  async function login({
    callbackUrl,
    captchaToken,
    email,
    errorCallbackUrl,
    magicLink,
    newUserCallbackUrl,
    password,
    phoneNumber,
    providerId,
    ...rest
  } = {}) {
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    const captchaOptions = captchaFetchOptions(captchaToken);
    const providers = auth.authConfig?.providers ?? [];

    // The magic-link and social/OAuth routes accept these two extra callbacks;
    // resolve each as a structured target and forward only the ones the app
    // supplied, so BetterAuth's own default-to-callbackURL stands otherwise.
    const routingCallbacks = {};
    const newUserCallbackURL = resolveTargetURL({
      lowdefy,
      callbackUrl: newUserCallbackUrl,
      name: 'newUserCallbackUrl',
    });
    if (!type.isNone(newUserCallbackURL)) {
      routingCallbacks.newUserCallbackURL = newUserCallbackURL;
    }
    const errorCallbackURL = resolveTargetURL({
      lowdefy,
      callbackUrl: errorCallbackUrl,
      name: 'errorCallbackUrl',
    });
    if (!type.isNone(errorCallbackURL)) {
      routingCallbacks.errorCallbackURL = errorCallbackURL;
    } else {
      // No caller-supplied error destination: default to the app's declared
      // auth-error page (authPages.error), resolved through resolveTargetURL
      // like every other callback so basePath handling stays in one place and
      // an absolute authPages.error passes through untouched. For the
      // app-relative page this yields `${basePath}${authPages.error}`, so a
      // failed magic-link verify lands there with ?error= intact instead of on
      // the success page. Mirrors the server-side onAPIError.errorURL default
      // (signup-admission-gate Decision 5) on the one path that default cannot
      // structurally reach. Omitted when authPages.error is unset, letting
      // BetterAuth's fallback stand.
      const errorPage = auth.authConfig?.authPages?.error;
      if (type.isString(errorPage)) {
        routingCallbacks.errorCallbackURL = resolveTargetURL({
          lowdefy,
          callbackUrl: { url: errorPage },
          name: 'errorCallbackUrl',
        });
      }
    }

    if (
      type.isNone(providerId) &&
      type.isNone(email) &&
      type.isNone(phoneNumber) &&
      providers.length === 1
    ) {
      providerId = providers[0].id;
    }

    if (!type.isNone(providerId)) {
      assertCallbackUrlNavigable({ callbackUrl, method: 'Login with a provider' });
      const provider = providers.find((configured) => configured.id === providerId);
      if (type.isNone(provider)) {
        throw new Error(`Login provider "${providerId}" is not a configured auth provider.`);
      }
      if (provider.type === 'GenericOAuth') {
        return unwrap(
          auth.signInOauth2({
            providerId,
            callbackURL,
            ...routingCallbacks,
            ...rest,
            ...captchaOptions,
          })
        );
      }
      return unwrap(
        auth.signInSocial({
          provider: provider.type.toLowerCase(),
          callbackURL,
          ...routingCallbacks,
          ...rest,
          ...captchaOptions,
        })
      );
    }
    if (magicLink === true) {
      assertCallbackUrlNavigable({ callbackUrl, method: 'Login with magicLink' });
      if (!type.isString(email)) {
        throw new Error('Login with magicLink requires an "email" param.');
      }
      return unwrap(
        auth.signInMagicLink({
          email,
          callbackURL,
          ...routingCallbacks,
          ...rest,
          ...captchaOptions,
        })
      );
    }
    if (!type.isNone(phoneNumber)) {
      if (!type.isString(password)) {
        throw new Error('Login with phoneNumber requires a "password" param.');
      }
      const data = await unwrap(
        auth.signInPhoneNumber({ phoneNumber, password, ...rest, ...captchaOptions })
      );
      if (data?.twoFactorRedirect) {
        return navigateToTwoFactorChallenge({ callbackURL, lowdefy, auth })
          ? stopChain(data)
          : data;
      }
      const window = lowdefy._internal?.globals?.window;
      if (callbackURL && window) {
        window.location.assign(callbackURL);
      }
      return data;
    }
    if (!type.isNone(email) || !type.isNone(password)) {
      const data = await unwrap(auth.signInEmail({ email, password, ...rest, ...captchaOptions }));
      // A 2FA-enrolled user gets a challenge, not a session - navigate to
      // authPages.twoFactor instead of the callback URL, where TwoFactorVerify
      // completes the session. The response still carries twoFactorRedirect and
      // twoFactorMethods for an app that wants to read them, but the routing is
      // not the app's job.
      //
      // The chain ends here: without that, the step the app put after Login
      // races the challenge page load and re-renders the app with no session.
      // When there was nothing to navigate to the chain continues as before, so
      // a chain is never stranded by a navigation that did not happen.
      if (data?.twoFactorRedirect) {
        return navigateToTwoFactorChallenge({ callbackURL, lowdefy, auth })
          ? stopChain(data)
          : data;
      }
      const window = lowdefy._internal?.globals?.window;
      if (callbackURL && window) {
        window.location.assign(callbackURL);
      }
      return data;
    }
    throw new Error(
      'Login requires a "providerId", "email" and "password", "phoneNumber" and "password", or "magicLink: true" param.'
    );
  }

  // Creates an email/password account (BetterAuth's one signup endpoint).
  // Social, magic-link and passkey have no separate signup - the account is
  // created on first sign-in via login - so SignUp is email/password only.
  async function signUp({ callbackUrl, captchaToken, email, name, password, ...rest } = {}) {
    // signUp is the case where the two consumers diverge: Lowdefy navigates on
    // the session-bearing success, and BetterAuth puts the same value in the
    // verification email. A value with two consumers cannot be suppressed for
    // one of them alone.
    assertCallbackUrlNavigable({ callbackUrl, method: 'SignUp' });
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    const data = await unwrap(
      auth.signUpEmail({
        email,
        password,
        name,
        callbackURL,
        ...rest,
        ...captchaFetchOptions(captchaToken),
      })
    );
    // With requireEmailVerification the response carries no session - do not
    // navigate; the page shows a "verify your email" message instead.
    const window = lowdefy._internal?.globals?.window;
    if (data?.token && callbackURL && window) {
      window.location.assign(callbackURL);
    }
    return data;
  }

  // Deliberately the one method outside resolveCallbackURL's ladder: it reads
  // neither the ?callbackUrl= query nor the home default. With no callback the
  // session provider's post-sign-out reload takes over and the server re-applies
  // the page auth fork, which is the right landing for a sign-out - sending a
  // signed-out user to the home page could land them on a page they may no
  // longer see.
  async function logout({ callbackUrl } = {}) {
    const callbackURL = resolveTargetURL({ lowdefy, callbackUrl });
    const window = lowdefy._internal?.globals?.window;
    const willNavigate = Boolean(callbackURL && window);
    if (willNavigate && auth.suppressSignOutReload) {
      // The sign-out reload in the session provider would race the callback
      // navigation - suppress it for this sign-out.
      auth.suppressSignOutReload();
    }
    const data = await unwrap(auth.signOut());
    if (willNavigate) {
      window.location.assign(callbackURL);
    }
    return data;
  }

  // Switches the session's active organization - the session-scoped org
  // switch. Roles and attributes resolve from the new active member row
  // server-side; chain UpdateSession after to re-sync the client.
  async function setActiveOrganization({ organizationId, organizationSlug } = {}) {
    if (type.isNone(organizationId) && type.isNone(organizationSlug)) {
      throw new Error(
        'SetActiveOrganization requires an "organizationId" or "organizationSlug" param.'
      );
    }
    return unwrap(auth.setActiveOrganization({ organizationId, organizationSlug }));
  }

  // Refreshes the BetterAuth client session store through an awaited
  // store refetch, bypassing the cookie cache (a live re-resolve) so role,
  // attribute or session changes surface immediately instead of after
  // cookieCache.maxAge. The store holds a fresh session user before this
  // resolves. Roles and merged attributes come from the server-resolved
  // caller - the active member row read the base session does not carry.
  async function updateSession() {
    const session = await unwrap(auth.refreshSession({ disableCookieCache: true }));
    const { user } = await auth.getResolvedUser();
    if (session && type.isNone(user)) {
      // A session with no resolved caller is the admission wall rejecting a
      // real session, not a logout - surface it instead of nulling the caller.
      throw new Error('UpdateSession failed: a session is active but the server resolved no user.');
    }
    if (auth.updateResolvedUser) {
      auth.updateResolvedUser(user ?? null);
    }
    lowdefy.user = user ?? null;
  }

  // Accepts an organization invitation. BetterAuth's endpoint enforces the
  // session-email to invitation-email match - no re-check here.
  async function acceptInvitation({ invitationId } = {}) {
    if (!type.isString(invitationId)) {
      throw new Error('AcceptInvitation requires an "invitationId" param.');
    }
    return unwrap(auth.acceptInvitation({ invitationId }));
  }

  // Invites a user to the caller's active organization - no organizationId
  // is forwarded, so BetterAuth defaults to the active org. Authorization is
  // BetterAuth's own per-org access control, enforced server-side against
  // the caller's member role in the active organization.
  async function inviteMember({ email, role } = {}) {
    if (!type.isString(email)) {
      throw new Error('InviteMember requires an "email" param.');
    }
    if (!type.isString(role) && !type.isArray(role)) {
      throw new Error('InviteMember requires a "role" param.');
    }
    return unwrap(auth.inviteMember({ email, role }));
  }

  // Cancels a pending invitation in the caller's active organization.
  // Authorization is BetterAuth's own per-org access control, enforced
  // server-side against the caller's member role in the active organization.
  async function cancelInvitation({ invitationId } = {}) {
    if (!type.isString(invitationId)) {
      throw new Error('CancelInvitation requires an "invitationId" param.');
    }
    return unwrap(auth.cancelInvitation({ invitationId }));
  }

  // Removes a member from the caller's active organization - no
  // organizationId is forwarded, so BetterAuth defaults to the active org.
  // Authorization is BetterAuth's own per-org access control, enforced
  // server-side against the caller's member role in the active organization.
  async function removeMember({ memberIdOrEmail } = {}) {
    if (!type.isString(memberIdOrEmail)) {
      throw new Error('RemoveMember requires a "memberIdOrEmail" param.');
    }
    return unwrap(auth.removeMember({ memberIdOrEmail }));
  }

  // Updates a member's role in the caller's active organization - no
  // organizationId is forwarded, so BetterAuth defaults to the active org.
  // Authorization is BetterAuth's own per-org access control, enforced
  // server-side against the caller's member role in the active organization.
  async function updateMemberRole({ memberId, role } = {}) {
    if (!type.isString(memberId)) {
      throw new Error('UpdateMemberRole requires a "memberId" param.');
    }
    if (!type.isString(role) && !type.isArray(role)) {
      throw new Error('UpdateMemberRole requires a "role" param.');
    }
    return unwrap(auth.updateMemberRole({ memberId, role }));
  }

  // Renames the caller's active organization - no organizationId is
  // forwarded, so BetterAuth defaults to the active org. Authorization is
  // BetterAuth's own per-org access control, enforced server-side against
  // the caller's member role in the active organization.
  async function updateOrganization({ name } = {}) {
    if (!type.isString(name)) {
      throw new Error('UpdateOrganization requires a "name" param.');
    }
    return unwrap(auth.updateOrganization({ data: { name } }));
  }

  // Removes the caller's own membership from the active organization.
  // BetterAuth's leave endpoint requires an explicit organizationId, so it
  // is resolved from the session's active organization - the action can
  // only ever leave the org the caller is acting in. Authorization is
  // BetterAuth's own per-org access control, enforced server-side against
  // the caller's member role in the active organization.
  async function leaveOrganization() {
    const session = await unwrap(auth.getSession());
    const organizationId = session?.session?.activeOrganizationId;
    if (type.isNone(organizationId)) {
      throw new Error('LeaveOrganization requires an active organization on the session.');
    }
    return unwrap(auth.leaveOrganization({ organizationId }));
  }

  async function changePassword({ currentPassword, newPassword, revokeOtherSessions } = {}) {
    if (!type.isString(currentPassword) || !type.isString(newPassword)) {
      throw new Error('ChangePassword requires "currentPassword" and "newPassword" params.');
    }
    return unwrap(auth.changePassword({ currentPassword, newPassword, revokeOtherSessions }));
  }

  async function passkeyDelete({ passkeyId } = {}) {
    if (!type.isString(passkeyId)) {
      throw new Error('PasskeyDelete requires a "passkeyId" param.');
    }
    return unwrap(auth.deletePasskey({ id: passkeyId }));
  }

  // The BetterAuth client method runs the whole WebAuthn browser ceremony
  // itself - it fetches the registration options, prompts the authenticator
  // and verifies the result - so the ceremony runs inside the action.
  async function passkeyRegister(params = {}) {
    return unwrap(auth.addPasskey(params));
  }

  // Passkey sign-in: the BetterAuth client method runs the whole WebAuthn
  // assertion ceremony itself (options fetch, navigator.credentials.get(),
  // verification), so the ceremony runs inside the action. verify-authentication
  // creates the session, so on success navigate to callbackUrl like login's
  // email path. A successful assertion is terminal - passkey never returns a
  // two-factor challenge - so there is no twoFactorRedirect branch.
  async function passkeySignIn({ callbackUrl } = {}) {
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    const data = await unwrap(auth.signInPasskey());
    const window = lowdefy._internal?.globals?.window;
    if (callbackURL && window) {
      window.location.assign(callbackURL);
    }
    return data;
  }

  // Dispatches by parameter, matching login: a phoneNumber param requests the
  // reset code over SMS (the "phone.passwordReset.send" hook), otherwise
  // email carries the reset link.
  async function requestPasswordReset({
    captchaToken,
    email,
    phoneNumber,
    redirectTo,
    ...rest
  } = {}) {
    const captchaOptions = captchaFetchOptions(captchaToken);
    if (type.isString(phoneNumber)) {
      return unwrap(
        auth.phoneNumberRequestPasswordReset({ phoneNumber, ...rest, ...captchaOptions })
      );
    }
    if (!type.isString(email)) {
      throw new Error('RequestPasswordReset requires an "email" or "phoneNumber" param.');
    }
    return unwrap(auth.requestPasswordReset({ email, redirectTo, ...rest, ...captchaOptions }));
  }

  // Dispatches by parameter: a phoneNumber param resets with the SMS otp,
  // otherwise token carries the emailed reset link's token.
  async function resetPassword({ newPassword, otp, phoneNumber, token, ...rest } = {}) {
    if (!type.isString(newPassword)) {
      throw new Error('ResetPassword requires a "newPassword" param.');
    }
    if (type.isString(phoneNumber)) {
      if (!type.isString(otp)) {
        throw new Error('ResetPassword with phoneNumber requires an "otp" param.');
      }
      return unwrap(auth.phoneNumberResetPassword({ phoneNumber, otp, newPassword, ...rest }));
    }
    return unwrap(auth.resetPassword({ newPassword, token, ...rest }));
  }

  // Revokes every session except the current one - the only session revoke
  // exposed to config; per-session revoke would put session tokens in
  // config reach.
  async function revokeOtherSessions() {
    return unwrap(auth.revokeOtherSessions());
  }

  // Resends the verification email for an unverified account - an unverified
  // user holds no session, so this is a public call. The callbackUrl is
  // where the emailed verification link lands after verifying, matching the
  // signUp param of the same name.
  async function sendVerificationEmail({ callbackUrl, captchaToken, email, ...rest } = {}) {
    if (!type.isString(email)) {
      throw new Error('SendVerificationEmail requires an "email" param.');
    }
    assertCallbackUrlNavigable({ callbackUrl, method: 'SendVerificationEmail' });
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    return unwrap(
      auth.sendVerificationEmail({
        email,
        callbackURL,
        ...rest,
        ...captchaFetchOptions(captchaToken),
      })
    );
  }

  // Sends a sign-in/verification OTP over SMS through the app's
  // "phone.otp.send" hook binding.
  async function phoneNumberSendOtp({ captchaToken, phoneNumber, ...rest } = {}) {
    if (!type.isString(phoneNumber)) {
      throw new Error('PhoneNumberSendOtp requires a "phoneNumber" param.');
    }
    return unwrap(
      auth.phoneNumberSendOtp({ phoneNumber, ...rest, ...captchaFetchOptions(captchaToken) })
    );
  }

  // The OTP sign-in: on success BetterAuth sets the session cookie (and
  // creates the account under signUpOnVerification), and the browser navigates
  // on the resolved callbackURL like every other method that mints a session.
  async function phoneNumberVerify({ callbackUrl, code, phoneNumber, ...rest } = {}) {
    if (!type.isString(phoneNumber) || !type.isString(code)) {
      throw new Error('PhoneNumberVerify requires "phoneNumber" and "code" params.');
    }
    // Resolved before the call, as login and signUp do, so a misconfigured
    // destination throws before the OTP is consumed rather than after. No
    // assertCallbackUrlNavigable: the resolved value has one consumer, the assign
    // below, so callbackUrl: false is honorable here.
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    const data = await unwrap(auth.phoneNumberVerify({ phoneNumber, code, ...rest }));
    // An enrolled user verifying by SMS gets a challenge instead of a session, in
    // the same JSON shape the password paths return, so the navigation is the one
    // Login performs and the destination rides along identically.
    //
    // The halt keeps the app's remaining steps from re-rendering with no session
    // while the challenge page load is still in flight.
    if (data?.twoFactorRedirect) {
      return navigateToTwoFactorChallenge({ callbackURL, lowdefy, auth }) ? stopChain(data) : data;
    }
    // The two modes that mint no usable arrival stay put: disableSession returns
    // token: null, and updatePhoneNumber is a signed-in user confirming a new
    // number - it returns their existing session token, so a token check alone
    // would yank them out of what is usually a modal. The discriminator has to
    // come from the request, and updatePhoneNumber is still in rest because
    // BetterAuth needs it.
    const window = lowdefy._internal?.globals?.window;
    if (data?.token && rest.updatePhoneNumber !== true && callbackURL && window) {
      window.location.assign(callbackURL);
    }
    return data;
  }

  async function twoFactorDisable({ password, ...rest } = {}) {
    if (!type.isString(password)) {
      throw new Error('TwoFactorDisable requires a "password" param.');
    }
    return unwrap(auth.twoFactorDisable({ password, ...rest }));
  }

  // Returns the totpURI and backup codes the page must render once - the
  // action response is the only carrier (readable via _actions in the same
  // event chain); no side-channel state.
  async function twoFactorEnable({ password, ...rest } = {}) {
    if (!type.isString(password)) {
      throw new Error('TwoFactorEnable requires a "password" param.');
    }
    return unwrap(auth.twoFactorEnable({ password, ...rest }));
  }

  // Serves both enrolment confirmation and the sign-in challenge, dispatching
  // by parameter (matching login): a backupCode param verifies a backup code,
  // otherwise code verifies TOTP.
  //
  // The engine owns both ends of the challenge hop, not only arrival: every
  // sign-in path navigates to authPages.twoFactor carrying ?callbackUrl=, and
  // this is where that value is spent. Leaving the last hop to the challenge
  // page is the same opt-in correctness the arrival navigation exists to avoid,
  // and the rung is awkward to consume from config besides - it already carries
  // basePath, so a Link's pageId double-prefixes it under a subpath. With the
  // engine finishing the hop, no app config reads the parameter at all.
  //
  // No stopChain: this navigation is the end of the flow rather than a departure
  // mid-chain, so an app may legitimately have a step after it.
  async function twoFactorVerify({ backupCode, callbackUrl, code, trustDevice, ...rest } = {}) {
    if (!type.isString(backupCode) && !type.isString(code)) {
      throw new Error('TwoFactorVerify requires a "code" or "backupCode" param.');
    }
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    const data = await unwrap(
      type.isString(backupCode)
        ? auth.twoFactorVerifyBackupCode({ code: backupCode, trustDevice, ...rest })
        : auth.twoFactorVerifyTotp({ code, trustDevice, ...rest })
    );
    // A token is the whole guard here, unlike phoneNumberVerify's: verify has no
    // session-less mode, so a successful challenge always mints one and a failed
    // one throws to the action's catch.
    const window = lowdefy._internal?.globals?.window;
    if (data?.token && callbackURL && window) {
      window.location.assign(callbackURL);
    }
    return data;
  }

  return {
    acceptInvitation,
    cancelInvitation,
    changePassword,
    inviteMember,
    leaveOrganization,
    login,
    logout,
    passkeyDelete,
    passkeyRegister,
    passkeySignIn,
    phoneNumberSendOtp,
    phoneNumberVerify,
    removeMember,
    requestPasswordReset,
    resetPassword,
    revokeOtherSessions,
    sendVerificationEmail,
    setActiveOrganization,
    signUp,
    twoFactorDisable,
    twoFactorEnable,
    twoFactorVerify,
    updateMemberRole,
    updateOrganization,
    updateSession,
  };
}

export default createAuthMethods;
