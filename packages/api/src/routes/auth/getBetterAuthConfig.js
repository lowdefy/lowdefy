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

import { genericOAuth, magicLink, twoFactor } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { ServerParser } from '@lowdefy/operators';
import { _app, _secret } from '@lowdefy/operators-js/operators/server';
import { type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import buildAdminPlugin from './buildAdminPlugin.js';
import buildCaptchaPlugin from './buildCaptchaPlugin.js';
import buildHooks from './hooks/buildHooks.js';
import buildOrganizationPlugin from './organizations/buildOrganizationPlugin.js';
import buildPhoneNumberPlugin from './buildPhoneNumberPlugin.js';
import buildProviders from './buildProviders.js';
import createAuthLogger from './createAuthLogger.js';
import createSendEmail from './createSendEmail.js';
import modelNames from './modelNames.js';
import renderAuthEmail from '../../email/renderAuthEmail.js';
import resolveCookiePrefix from './resolveCookiePrefix.js';

// Decision 4: under the "pinned" org policy, disable every mounted
// /organization/* HTTP path EXCEPT /organization/accept-invitation (the
// invitation flow depends on it and BetterAuth gates it itself). /organization/create
// is already off via allowUserToCreateOrganization:false. The audited admin steps
// bypass the router (callPluginEndpoint), so disabling these closes client HTTP
// access without breaking them. Set on the top-level `options.disabledPaths` (a
// BetterAuth CORE option, not an org-plugin option): the router's onRequest matches
// exactly via disabledPaths.includes(normalizedPath), with basePath/`/api/auth`
// stripped first, so entries must be the exact basePath-stripped `/organization/<segment>`.
// Verified against the mounted surface of better-auth@1.6.23. Team (`*-team*`) and
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
  '/organization/list',
  '/organization/get-invitation',
  '/organization/list-invitations',
  '/organization/list-user-invitations',
  '/organization/check-slug',
  '/organization/reject-invitation',
  '/organization/has-permission',
];

// Assembles the BetterAuthOptions object from the auth.json build artifact.
// Build has validated the config and written all defaults, so this function
// resolves the _secret operators and maps the Lowdefy surface onto
// BetterAuth's options - no fallback defaults here.
// createSystemContext builds a fresh off-request context per hook fire - the
// bridge a firing hook uses to invoke its InternalApi endpoint.
// getAuth returns the constructed BetterAuth instance - the engine-tier
// hooks resolve it lazily at fire time, after construction completes.
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
        'Auth base URL is not pinned. Set BETTER_AUTH_URL to the app\'s canonical origin (e.g. https://app.example.com) so password-reset, magic-link and verification email links cannot be spoofed through the Host header.'
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
      additionalFields: {
        attributes: { type: 'json', required: false, input: false },
        profile: { type: 'json', required: false, input: false },
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
        const { subject, html, text } = await renderAuthEmail({
          flow: 'resetPassword',
          vars: { url },
          authEmailConfig: authConfig.email,
          baseURL: baseUrlOrigin,
          context,
        });
        await sendEmail({ to: user.email, subject, html, text, context });
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
        const { subject, html, text } = await renderAuthEmail({
          flow: 'verifyEmail',
          vars: { url },
          authEmailConfig: authConfig.email,
          baseURL: baseUrlOrigin,
          context,
        });
        await sendEmail({ to: user.email, subject, html, text, context });
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
          const { subject, html, text } = await renderAuthEmail({
            flow: 'magicLink',
            vars: { url },
            authEmailConfig: authConfig.email,
            baseURL: baseUrlOrigin,
            context,
          });
          await sendEmail({ to: email, subject, html, text, context });
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
        issuer: appMeta?.name,
        schema: { twoFactor: { modelName: modelNames.twoFactor } },
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

  // The admin plugin is framework-controlled - it backs the admin steps and
  // impersonation. A configured auth.userAdminRole registers a curated
  // access control (see buildAdminPlugin).
  options.plugins.push(buildAdminPlugin({ authConfig }));

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
      throw new Error('Cannot send the invitation email. Configure "auth.email".');
    }
    const acceptPath = authConfig.authPages?.acceptInvitation;
    const canBuildAcceptUrl = type.isString(baseUrlOrigin) && type.isString(acceptPath);
    const basePath = config.basePath ?? '';
    const acceptUrl = canBuildAcceptUrl
      ? `${baseUrlOrigin}${basePath}${acceptPath}?invitationId=${invitation.id}`
      : undefined;
    const context = createSystemContext({ auth: getAuth() });
    const { subject, html, text } = await renderAuthEmail({
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
    await sendEmail({ to: email, subject, html, text, context });
  }

  options.plugins.push(
    buildOrganizationPlugin({
      authConfig,
      getAuth,
      sendInvitationEmail,
    })
  );

  // Policy-aware lockdown of the org plugin's client HTTP endpoints (Decision 4).
  // pinned: disable the full set (everything except accept-invitation/create).
  // tenant: self-serve, leave the org endpoints enabled.
  const policy = authConfig.organizations?.policy ?? 'pinned';
  options.disabledPaths = policy === 'pinned' ? ORG_CLIENT_PATHS_DISABLED_WHEN_PINNED : [];

  return options;
}

export default getBetterAuthConfig;
