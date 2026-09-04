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

import { randomUUID } from 'node:crypto';

import { customSession, genericOAuth, jwt, magicLink, twoFactor } from 'better-auth/plugins';
import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { oauthProvider } from '@better-auth/oauth-provider';
import { passkey } from '@better-auth/passkey';
import { ServerParser } from '@lowdefy/operators';
import { _app, _secret } from '@lowdefy/operators-js/operators/server';
import { type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import buildAdminPlugin from './buildAdminPlugin.js';
import buildCaptchaPlugin from './buildCaptchaPlugin.js';
import buildHooks from './hooks/buildHooks.js';
import buildOrganizationPlugin from './organizations/buildOrganizationPlugin.js';
import buildOauthPostLogin from './buildOauthPostLogin.js';
import buildPhoneNumberPlugin from './buildPhoneNumberPlugin.js';
import buildProviders from './buildProviders.js';
import buildRequestHooks from './requestHooks/buildRequestHooks.js';
import createAuthLogger from './createAuthLogger.js';
import createOnAPIError from './createOnAPIError.js';
import createSendEmail from './createSendEmail.js';
import modelNames from './modelNames.js';
import renderAuthEmail from '../../email/renderAuthEmail.js';
import resolveCookiePrefix from './resolveCookiePrefix.js';
import sanitizeSessionResponse from './sanitizeSessionResponse.js';

// Decision 4: under the "pinned" org policy, disable every mounted
// /organization/* HTTP path EXCEPT /organization/accept-invitation (the
// invitation flow depends on it and BetterAuth gates it itself). /organization/create
// is already off via allowUserToCreateOrganization:false. The audited admin steps
// bypass the router (callPluginEndpoint), so disabling these closes client HTTP
// access without breaking them. Set on the top-level `options.disabledPaths` (a
// BetterAuth CORE option, not an org-plugin option): the router's onRequest matches
// exactly via disabledPaths.includes(normalizedPath), with basePath/`/api/auth`
// stripped first, so entries must be the exact basePath-stripped `/organization/<segment>`.
// Verified against the mounted surface of better-auth@1.7.0. Team (`*-team*`) and
// dynamic-access-control role (`*-role`) endpoints are conditional on
// teams.enabled / dynamicAccessControl.enabled - neither is set by
// buildOrganizationPlugin, so they are not mounted and are not listed here.
const ORG_CLIENT_PATHS_DISABLED_WHEN_PINNED = [
  // Mutations
  '/organization/set-active',
  '/organization/update',
  '/organization/delete',
  '/organization/leave',
  '/organization/update-member-role',
  '/organization/remove-member',
  '/organization/invite-member',
  '/organization/cancel-invitation',
  // Reads
  '/organization/list-members',
  '/organization/get-active-member',
  '/organization/get-active-member-role',
  '/organization/get-full-organization',
  '/organization/get-organization',
  '/organization/list',
  '/organization/get-invitation',
  '/organization/list-invitations',
  '/organization/list-user-invitations',
  '/organization/check-slug',
  '/organization/reject-invitation',
  '/organization/has-permission',
];

// The admin plugin's entire mounted HTTP surface is disabled under both org
// policies. Its checks read the deployment-wide user.role, which nothing in
// Lowdefy writes, so no browser caller could pass one anyway - this is defence
// in depth against a future writer, not the load-bearing guard.
// Disabling costs the admin steps nothing: getPluginEndpoint reaches
// plugin.endpoints[key] directly, so their calls never travel through the
// router that consults disabledPaths.
// Enumerated from the endpoints better-auth@1.7.0's admin plugin mounts. Every
// path is listed literally - the router matches exactly (see the note on
// ORG_CLIENT_PATHS_DISABLED_WHEN_PINNED above), so a prefix or wildcard entry
// would disable nothing.
const ADMIN_PATHS_DISABLED = [
  '/admin/set-role',
  '/admin/get-user',
  '/admin/create-user',
  '/admin/update-user',
  '/admin/list-users',
  '/admin/list-user-sessions',
  '/admin/unban-user',
  '/admin/ban-user',
  '/admin/impersonate-user',
  '/admin/stop-impersonating',
  '/admin/revoke-user-session',
  '/admin/revoke-user-sessions',
  '/admin/remove-user',
  '/admin/set-user-password',
  '/admin/has-permission',
];

// Assembles the BetterAuthOptions object from the auth.json build artifact.
// Build has validated the config and written all defaults, so this function
// resolves the _secret operators and maps the Lowdefy surface onto
// BetterAuth's options - no fallback defaults here.
// createSystemContext builds a fresh off-request context per hook fire - the
// bridge a firing hook uses to invoke its InternalApi endpoint.
// getAuth returns the constructed BetterAuth instance - the engine-tier
// hooks resolve it lazily at fire time, after construction completes.
// The scopes the authorization server offers MCP clients, and the vocabulary
// the per-org protected-resource metadata advertises (RFC 9728
// scopes_supported) - both read this list so they can never drift apart.
const MCP_OAUTH_SCOPES = ['mcp:read', 'mcp:write', 'offline_access'];

function getBetterAuthConfig({
  appMeta,
  authJson,
  config = {},
  createSystemContext,
  dev = false,
  getAuth,
  logger,
  plugins,
  secrets,
}) {
  if (type.isNone(getAuth)) {
    throw new LowdefyInternalError(
      'No getAuth accessor was provided to getBetterAuthConfig - the engine-tier membership hooks resolve the BetterAuth instance through it.'
    );
  }
  const operatorsParser = new ServerParser({
    lowdefyApp: appMeta,
    operators: { _app, _secret },
    secrets,
    user: {},
  });

  const { output: authConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
    payload: {},
  });

  if (operatorErrors.length > 0) {
    // Startup fails on the first error; log the rest so they can all be
    // fixed in one pass instead of one boot per error.
    operatorErrors.slice(1).forEach((error) => logger.error(error));
    throw operatorErrors[0];
  }

  if (!type.isString(authConfig.secret)) {
    throw new ConfigError(
      'Auth "secret" did not resolve to a string. Check the _secret operator reference and that the secret is set.',
      { received: type.typeOf(authConfig.secret) }
    );
  }
  // Secrets are opaque at build time; strength checks are startup warnings.
  if (authConfig.secret.length < 32) {
    logger.warn(
      'Auth "secret" is shorter than 32 characters. Use a long random value, e.g. `openssl rand -base64 32`.'
    );
  }

  // A strategies-only app configures no database - BetterAuth is constructed
  // without an adapter (its stateless mode, backed by a memory adapter), so
  // getSession runs guard-free and returns null on every request.
  let database;
  if (!type.isNone(authConfig.database)) {
    const adapterPlugin = plugins.adapters[authConfig.database.type];
    if (type.isNone(adapterPlugin)) {
      throw new ConfigError(
        `Auth database adapter type "${authConfig.database.type}" not found at database "${authConfig.database.id}".`,
        { configKey: authConfig.database['~k'] }
      );
    }
    try {
      database = adapterPlugin({ properties: authConfig.database.properties ?? {} });
    } catch (error) {
      // Adapter plugins throw plain errors (missing uri, malformed
      // connection string) - attach the database block's config location.
      throw new ConfigError(
        `Auth database "${authConfig.database.id}" failed to construct: ${error.message}`,
        { cause: error, configKey: authConfig.database['~k'] }
      );
    }
  }

  const { socialProviders, genericOAuthConfigs } = buildProviders({ authConfig, plugins });

  const sendEmail = type.isNone(authConfig.email)
    ? undefined
    : createSendEmail({ connectionId: authConfig.email.connectionId });

  // BetterAuth builds password-reset, magic-link and email-verification links,
  // and its CSRF Origin allowlist, from the base URL. When the deployment's
  // canonical origin is pinned via BETTER_AUTH_URL, both are fixed and cannot
  // be steered by a spoofed Host / X-Forwarded-Host header (CWE-640
  // password-reset poisoning). Without it, fall back to per-request host
  // derivation - the zero-config path that supports arbitrary proxies and
  // multi-host deployments - and warn in production that the host is then
  // caller-controlled.
  const canonicalUrl = process.env.BETTER_AUTH_URL?.trim();
  let baseURL;
  if (canonicalUrl) {
    baseURL = canonicalUrl;
  } else {
    if (!dev) {
      logger.warn(
        "Auth base URL is not pinned. Set BETTER_AUTH_URL to the app's canonical origin (e.g. https://app.example.com) so password-reset, magic-link and verification email links cannot be spoofed through the Host header."
      );
    }
    baseURL = { allowedHosts: ['*'], protocol: dev ? 'http' : 'auto' };
  }
  // When BETTER_AUTH_URL is not pinned baseURL is an object and the origin is
  // unknown - used for logo resolution AND the invitation accept-URL fallback.
  const baseUrlOrigin = type.isString(baseURL) ? baseURL : undefined;

  const options = {
    appName: appMeta?.name ?? 'Lowdefy',
    baseURL,
    basePath: `${config.basePath ?? ''}/api/auth`,
    secret: authConfig.secret,
    telemetry: { enabled: false },
    logger: createAuthLogger({ logger }),
    user: {
      modelName: modelNames.user,
      // Internal additionalFields, deliberately not an app-facing surface:
      // attributes holds admin-set, cross-app authorization inputs;
      // profile is the opaque display-and-app-data bag written by module or
      // app logic (UpdateUserProfile) - the platform never validates,
      // indexes, or reads inside it.
      //
      // contactId is the link to the app's canonical record for the human
      // behind this login. It carries profile's opaque contract, not
      // attributes' - stored, projected onto the caller, and otherwise
      // ignored: never validated, indexed, or read by the platform, and never
      // resolved to whatever it points at. That is module work, and which
      // record the name means is the module's business. A first-class field
      // rather than a key inside profile, because a link to another entity is
      // a different kind of thing from an opaque attribute bag - it belongs
      // with the user's other structural facts.
      additionalFields: {
        attributes: { type: 'json', required: false, input: false },
        profile: { type: 'json', required: false, input: false },
        contactId: { type: 'string', required: false, input: false },
      },
    },
    verification: { modelName: modelNames.verification },
    session: {
      modelName: modelNames.session,
      expiresIn: authConfig.session.expiresIn,
      updateAge: authConfig.session.updateAge,
      cookieCache: {
        enabled: authConfig.session.cookieCache.enabled,
        maxAge: authConfig.session.cookieCache.maxAge,
      },
    },
    account: {
      modelName: modelNames.account,
      accountLinking: {
        enabled: authConfig.account.accountLinking.enabled,
        trustedProviders: authConfig.account.accountLinking.trustedProviders,
      },
    },
    rateLimit: {
      enabled: authConfig.rateLimit.enabled,
      window: authConfig.rateLimit.window,
      max: authConfig.rateLimit.max,
    },
    advanced: {
      cookiePrefix: resolveCookiePrefix({ appMeta, dev }),
      // Decision 7: function-form generateId. The vendored adapter stores a
      // function result verbatim as a plain string (no ObjectId/UUID-binary
      // coercion), so all ids are plain UUID strings that native reads match.
      database: { generateId: () => randomUUID() },
    },
    plugins: [],
  };

  if (!type.isNone(database)) {
    options.database = database;
  }

  if (authConfig.session.crossSubDomainCookies.enabled === true) {
    options.advanced.crossSubDomainCookies = {
      enabled: true,
      domain: authConfig.session.crossSubDomainCookies.domain,
    };
  }

  if (authConfig.emailAndPassword?.enabled === true) {
    options.emailAndPassword = {
      enabled: true,
      requireEmailVerification: authConfig.emailAndPassword.requireEmailVerification,
      minPasswordLength: authConfig.emailAndPassword.minPasswordLength,
      disableSignUp: authConfig.emailAndPassword.disableSignUp,
    };
    if (sendEmail) {
      options.emailAndPassword.sendResetPassword = async ({ user, url }) => {
        const context = createSystemContext({ auth: getAuth() });
        const { subject, html, text, notificationId } = await renderAuthEmail({
          flow: 'resetPassword',
          vars: { url },
          authEmailConfig: authConfig.email,
          baseURL: baseUrlOrigin,
          context,
        });
        await sendEmail({ to: user.email, subject, html, text, context, notificationId });
      };
    } else {
      // Password reset is implicit in emailAndPassword, so a missing email
      // config is a startup warning, not a build failure.
      logger.warn(
        'Auth "email" is not configured - password reset emails cannot be sent, so the reset flow is unavailable.'
      );
    }
  }

  if (sendEmail) {
    options.emailVerification = {
      sendVerificationEmail: async ({ user, url }) => {
        const context = createSystemContext({ auth: getAuth() });
        const { subject, html, text, notificationId } = await renderAuthEmail({
          flow: 'verifyEmail',
          vars: { url },
          authEmailConfig: authConfig.email,
          baseURL: baseUrlOrigin,
          context,
        });
        await sendEmail({ to: user.email, subject, html, text, context, notificationId });
      },
    };
  }

  if (Object.keys(socialProviders).length > 0) {
    options.socialProviders = socialProviders;
  }

  if (authConfig.magicLink?.enabled === true) {
    options.plugins.push(
      magicLink({
        expiresIn: authConfig.magicLink.expiresIn,
        disableSignUp: authConfig.magicLink.disableSignUp,
        sendMagicLink: async ({ email, url }) => {
          const context = createSystemContext({ auth: getAuth() });
          const { subject, html, text, notificationId } = await renderAuthEmail({
            flow: 'magicLink',
            vars: { url },
            authEmailConfig: authConfig.email,
            baseURL: baseUrlOrigin,
            context,
          });
          await sendEmail({ to: email, subject, html, text, context, notificationId });
        },
      })
    );
  }

  if (genericOAuthConfigs.length > 0) {
    options.plugins.push(genericOAuth({ config: genericOAuthConfigs }));
  }

  if (authConfig.twoFactor?.enabled === true) {
    options.plugins.push(
      twoFactor({
        allowPasswordless: true,
        issuer: appMeta?.name,
        schema: { twoFactor: { modelName: modelNames.twoFactor } },
        // trustDevice: false disables the 30-day "trust this device" skip. There
        // is no dedicated off switch upstream, but trustDeviceMaxAge: 0 mints
        // every trust record already expired and its cookie as a browser delete,
        // so no device is durably trusted and a forged trustDevice: true cannot
        // bypass. Omitted when on, so the plugin's 30-day default applies.
        ...(authConfig.twoFactor.trustDevice === false ? { trustDeviceMaxAge: 0 } : {}),
      })
    );
  }

  if (authConfig.passkey?.enabled === true) {
    options.plugins.push(
      passkey({
        rpID: authConfig.passkey.rpId,
        rpName: authConfig.passkey.rpName,
        schema: { passkey: { modelName: modelNames.passkey } },
      })
    );
  }

  // Captcha is server middleware only - the client half is the Captcha block
  // and the captchaToken action param carrying the x-captcha-response header.
  if (authConfig.captcha?.enabled === true) {
    options.plugins.push(buildCaptchaPlugin({ authConfig }));
  }

  // The app is its own OAuth 2.1 authorization server for the MCP endpoint.
  // The AS issuer and the MCP resource URI derive from the
  // canonical origin - a Host-derived issuer would let a spoofed Host header
  // steer where tokens are honoured, so an unpinned origin is a startup error.
  if (!type.isNone(authConfig.oauthProvider)) {
    if (!type.isString(baseUrlOrigin)) {
      throw new ConfigError(
        'Auth "oauthProvider" requires the BETTER_AUTH_URL environment variable to be set to the app\'s canonical origin. The authorization server issuer and the MCP resource URI derive from it.'
      );
    }
    const oauthPagesBasePath = config.basePath ?? '';
    options.plugins.push(
      // The oauth-provider delegates access-token signing to the core jwt
      // plugin and fails init without it. Only the signing keys are wanted
      // from it: /token (session-JWT minting) is disabled via disabledPaths
      // and disableSettingJwtHeader keeps the set-auth-jwt header off
      // /get-session responses; /jwks stays so access tokens are verifiable.
      // jwt.issuer is deliberately unset - the issuer then defaults to
      // BetterAuth's baseURL + basePath, `${BETTER_AUTH_URL}${basePath}/api/auth`.
      jwt({ disableSettingJwtHeader: true }),
      oauthProvider({
        loginPage: `${baseUrlOrigin}${oauthPagesBasePath}${authConfig.authPages.signIn}`,
        consentPage: `${baseUrlOrigin}${oauthPagesBasePath}${authConfig.oauthProvider.consentPage}`,
        // Which organization a grant acts in is chosen after login and before
        // consent, and travels as the consent referenceId - see
        // buildOauthPostLogin. Every access token carries it as the
        // organization_id claim the /api/mcp route resolves the member from;
        // the refresh grant re-stamps the same reference, so a refreshed
        // token keeps its organization.
        postLogin: buildOauthPostLogin({
          authConfig,
          baseUrlOrigin,
          basePath: oauthPagesBasePath,
        }),
        customAccessTokenClaims: ({ referenceId }) => ({ organization_id: referenceId }),
        // The closed MCP scope vocabulary. Without "openid" the OIDC surface
        // (id tokens, /oauth2/userinfo, /.well-known/openid-configuration)
        // stays dormant. "offline_access" is the OAuth-standard opt-in for a
        // refresh token: the oauth-provider issues one only when the grant
        // carries it, so without it every MCP client is signed out the moment
        // its access token lapses (hourly) and has to re-consent.
        scopes: MCP_OAUTH_SCOPES,
        // No client_credentials - every access token is user-consented.
        grantTypes: ['authorization_code', 'refresh_token'],
        // Any registered client may request any enabled resource - access is
        // decided by user consent and org membership, not client-resource links.
        enforcePerClientResources: false,
        // The one resource row is owned by the app, never administered over
        // HTTP.
        resourcePrivileges: () => false,
        ...(authConfig.oauthProvider.dynamicClientRegistration === true
          ? {
              // RFC 7591 open registration - the opt-in fallback for MCP
              // clients that cannot serve a CIMD document. Such clients carry
              // no session, so registration must be unauthenticated.
              allowDynamicClientRegistration: true,
              allowUnauthenticatedClientRegistration: true,
            }
          : {}),
      }),
      // CIMD is the default registration path: an MCP client identifies by an
      // HTTPS client_id URL serving its metadata document. Registers its
      // client discovery on the oauth-provider and advertises
      // client_id_metadata_document_supported in the AS metadata.
      cimd({ fetchClientMetadataResource })
    );
  }

  // The admin plugin is framework-controlled - it owns the user row's ban fields
  // and the endpoints the ban, delete and revoke-sessions steps call. Its whole
  // HTTP surface is disabled (see ADMIN_PATHS_DISABLED).
  options.plugins.push(buildAdminPlugin());

  const {
    afterEmailVerification,
    databaseHooks,
    phoneVerified,
    sendPhoneOtp,
    sendPhonePasswordResetOtp,
  } = buildHooks({
    authConfig,
    createSystemContext,
    getAuth,
    logger,
  });
  if (Object.keys(databaseHooks).length > 0) {
    options.databaseHooks = databaseHooks;
  }
  if (afterEmailVerification) {
    options.emailVerification = {
      ...options.emailVerification,
      afterEmailVerification,
    };
  }

  // Every engine-tier request hook lives in requestHooks/ and is dispatched by
  // path from one assembler. BetterAuth wraps options.hooks.before/.after as a
  // single match-all function each, so this is the only assignment of the slot -
  // a second one would clobber it.
  options.hooks = buildRequestHooks({
    authConfig,
    basePath: config.basePath ?? '',
    baseUrlOrigin,
    getAuth,
  });

  // Phone login sends SMS through the "phone.otp.send" hook binding - there
  // is no built-in SMS transport, so build validation requires the binding
  // when the plugin is enabled.
  if (authConfig.phoneNumber?.enabled === true) {
    options.plugins.push(
      buildPhoneNumberPlugin({
        authConfig,
        phoneVerified,
        sendPhoneOtp,
        sendPhonePasswordResetOtp,
      })
    );
  }

  // Organizations are always on, so the plugin always gets an invitation
  // sender. Without auth.email the sender throws at invite-send time (not at
  // build), the same stance as password reset. The accept URL is only
  // buildable when the origin is pinned AND authPages.acceptInvitation is set;
  // otherwise the stock InvitationEmail renders branded with no CTA button.
  async function sendInvitationEmail({ email, organization, invitation }) {
    if (type.isNone(authConfig.email)) {
      throw new ConfigError('Cannot send the invitation email. Configure "auth.email".');
    }
    const acceptPath = authConfig.authPages?.acceptInvitation;
    const canBuildAcceptUrl = type.isString(baseUrlOrigin) && type.isString(acceptPath);
    const basePath = config.basePath ?? '';
    const acceptUrl = canBuildAcceptUrl
      ? `${baseUrlOrigin}${basePath}${acceptPath}?invitationId=${invitation.id}`
      : undefined;
    const context = createSystemContext({ auth: getAuth() });
    const { subject, html, text, notificationId } = await renderAuthEmail({
      flow: 'invitation',
      vars: {
        url: acceptUrl,
        organizationName: organization.name,
        invitationId: invitation.id,
      },
      authEmailConfig: authConfig.email,
      baseURL: baseUrlOrigin,
      context,
    });
    await sendEmail({ to: email, subject, html, text, context, notificationId });
  }

  options.plugins.push(
    buildOrganizationPlugin({ authConfig, getAuth, logger, sendInvitationEmail })
  );

  // BetterAuth's default /get-session body includes the raw session token - the
  // credential half of the httpOnly session cookie. Lowdefy is cookie-based and
  // never reads it client-side, so strip it: a JS-readable token needlessly
  // undoes the point of the httpOnly cookie. customSession replaces the
  // /get-session endpoint and transforms whatever the core resolver returns, so
  // the token is dropped whether the session came from the DB or the cookie
  // cache. Registered last so the resolver has already applied the organization
  // (activeOrganizationId) and twoFactor session fields before the strip.
  options.plugins.push(
    customSession(async (sessionResponse) => sanitizeSessionResponse(sessionResponse))
  );

  // The admin surface is off under both policies. The org plugin's client HTTP
  // endpoints are policy-aware: pinned disables the full set (everything except
  // accept-invitation/create); tenant is self-serve, so they stay enabled.
  const policy = authConfig.organizations?.policy ?? 'pinned';
  options.disabledPaths = [
    ...ADMIN_PATHS_DISABLED,
    ...(policy === 'pinned' ? ORG_CLIENT_PATHS_DISABLED_WHEN_PINNED : []),
    // The jwt plugin is registered only to sign the oauth-provider's access
    // tokens - /token would mint a session-backed JWT for any logged-in
    // browser, a bearer credential Lowdefy's cookie-based clients never need.
    ...(type.isNone(authConfig.oauthProvider) ? [] : ['/token']),
  ];

  // Own the logging of auth API errors so a rejected attempt (4xx) is a warn
  // line, not an error - see createOnAPIError.
  options.onAPIError = { onError: createOnAPIError({ logger }) };

  // Decision 5: default every redirect-style auth error - chiefly an OAuth
  // failure - to the resolved authPages.error page, instead of BetterAuth's
  // bare built-in ${baseURL}/error. BetterAuth uses errorURL verbatim in the
  // redirect (it is not joined with baseURL), so make it an absolute app URL
  // when the origin is pinned; without a pinned origin fall back to the
  // app-relative path, which the browser resolves against the callback origin.
  // A per-action errorCallbackUrl on the login action still wins (BetterAuth
  // resolves errorURL ?? onAPIError.errorURL).
  if (type.isString(authConfig.authPages?.error)) {
    const errorPath = `${config.basePath ?? ''}${authConfig.authPages.error}`;
    options.onAPIError.errorURL = type.isString(baseUrlOrigin)
      ? `${baseUrlOrigin}${errorPath}`
      : errorPath;
  }

  return options;
}

export default getBetterAuthConfig;
export { MCP_OAUTH_SCOPES };
