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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

function getCallbackUrl({ lowdefy, callbackUrl = {}, name = 'callbackUrl' }) {
  const { home, pageId, urlQuery, url } = callbackUrl;

  const targets = [home, pageId, url].filter((target) => target);
  if (targets.length > 1) {
    throw new Error(
      `Invalid ${name}: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined.`
    );
  }
  const query = type.isNone(urlQuery) ? '' : `${urlQueryFn.stringify(urlQuery)}`;

  if (home === true) {
    return `/${lowdefy.home.configured ? '' : lowdefy.home.pageId}${query ? `?${query}` : ''}`;
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

// The action's callbackUrl param wins; otherwise honor the callbackUrl query
// param set by the unauthenticated page redirect, so login returns to the
// page the user asked for. Only relative paths are accepted from the query
// to avoid open redirects. The query fallback is exclusive to the primary
// callbackUrl - a new-user or error destination has no equivalent query
// source, so reading it for them would misroute.
function resolveCallbackURL({ lowdefy, callbackUrl }) {
  const explicit = resolveTargetURL({ lowdefy, callbackUrl });
  if (!type.isNone(explicit)) {
    return explicit;
  }
  const window = lowdefy._internal?.globals?.window;
  const fromQuery = new URLSearchParams(window?.location?.search ?? '').get('callbackUrl');
  if (type.isString(fromQuery) && fromQuery.startsWith('/')) {
    return fromQuery;
  }
  return undefined;
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
        return data;
      }
      const window = lowdefy._internal?.globals?.window;
      if (callbackURL && window) {
        window.location.assign(callbackURL);
      }
      return data;
    }
    if (!type.isNone(email) || !type.isNone(password)) {
      const data = await unwrap(auth.signInEmail({ email, password, ...rest, ...captchaOptions }));
      // A 2FA-enrolled user gets a challenge, not a session - do not navigate
      // as if signed in. The login page reads the outcome via _actions and
      // routes to the app's challenge page, where TwoFactorVerify completes
      // the session.
      if (data?.twoFactorRedirect) {
        return data;
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

  async function logout({ callbackUrl } = {}) {
    const callbackURL = getCallbackUrl({ lowdefy, callbackUrl });
    const window = lowdefy._internal?.globals?.window;
    const willNavigate = Boolean(callbackURL && window);
    if (willNavigate && auth.suppressSignOutReload) {
      // The sign-out reload in the session provider would race the callback
      // navigation - suppress it for this sign-out.
      auth.suppressSignOutReload();
    }
    const data = await unwrap(auth.signOut());
    if (willNavigate) {
      // Prefix basePath only onto app-relative callbacks - absolute URLs
      // (external logout landing pages) navigate as given.
      const target = callbackURL.startsWith('/')
        ? `${lowdefy.basePath ?? ''}${callbackURL}`
        : callbackURL;
      window.location.assign(target);
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

  // Impersonates a user for the session's remaining lifetime. Authorization
  // is BetterAuth's own admin access control, enforced server-side against
  // the caller's role - this method adds no gate of its own. Chain
  // UpdateSession after to re-sync the client with the impersonated user.
  async function impersonateUser({ userId } = {}) {
    if (!type.isString(userId)) {
      throw new Error('ImpersonateUser requires a "userId" param.');
    }
    return unwrap(auth.impersonateUser({ userId }));
  }

  // Ends impersonation and restores the original session. Chain
  // UpdateSession after to re-sync the client with the original user.
  async function stopImpersonating() {
    return unwrap(auth.stopImpersonating());
  }

  // Bypasses the cookie cache (a live re-resolve), so role, attribute or
  // session changes surface immediately instead of after cookieCache.maxAge.
  // Roles and merged attributes come from the server-resolved caller - the
  // active member row read the base session does not carry.
  async function updateSession() {
    await unwrap(auth.getSession({ disableCookieCache: true }));
    const { user } = await auth.getResolvedUser();
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
  // creates the account under signUpOnVerification). Like TwoFactorVerify and
  // unlike login it does not auto-navigate - verify serves sign-in, sign-up
  // and phone-change confirmation, and only the app knows which page follows.
  async function phoneNumberVerify({ code, phoneNumber, ...rest } = {}) {
    if (!type.isString(phoneNumber) || !type.isString(code)) {
      throw new Error('PhoneNumberVerify requires "phoneNumber" and "code" params.');
    }
    return unwrap(auth.phoneNumberVerify({ phoneNumber, code, ...rest }));
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
  // otherwise code verifies TOTP. The sign-in challenge verify sets the
  // session cookie itself - navigation after is the app's business.
  async function twoFactorVerify({ backupCode, code, trustDevice, ...rest } = {}) {
    if (type.isString(backupCode)) {
      return unwrap(auth.twoFactorVerifyBackupCode({ code: backupCode, trustDevice, ...rest }));
    }
    if (type.isString(code)) {
      return unwrap(auth.twoFactorVerifyTotp({ code, trustDevice, ...rest }));
    }
    throw new Error('TwoFactorVerify requires a "code" or "backupCode" param.');
  }

  return {
    acceptInvitation,
    changePassword,
    impersonateUser,
    login,
    logout,
    passkeyDelete,
    passkeyRegister,
    passkeySignIn,
    phoneNumberSendOtp,
    phoneNumberVerify,
    requestPasswordReset,
    resetPassword,
    revokeOtherSessions,
    sendVerificationEmail,
    setActiveOrganization,
    signUp,
    stopImpersonating,
    twoFactorDisable,
    twoFactorEnable,
    twoFactorVerify,
    updateSession,
  };
}

export default createAuthMethods;
