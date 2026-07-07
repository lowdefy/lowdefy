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

import { genericOAuth, magicLink, twoFactor } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { ServerParser } from '@lowdefy/operators';
import { _app, _secret } from '@lowdefy/operators-js/operators/server';
import { type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import buildAdminPlugin from './buildAdminPlugin.js';
import buildHooks from './hooks/buildHooks.js';
import buildOrganizationPlugin from './organizations/buildOrganizationPlugin.js';
import buildProviders from './buildProviders.js';
import createAuthLogger from './createAuthLogger.js';
import createSendEmail from './createSendEmail.js';
import createStockInvitationEmail from './organizations/createStockInvitationEmail.js';
import modelNames from './modelNames.js';
import resolveCookiePrefix from './resolveCookiePrefix.js';

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
    : createSendEmail({ emailConfig: authConfig.email });

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
        await sendEmail({
          to: user.email,
          subject: 'Reset your password',
          text: `Click the link to reset your password: ${url}`,
        });
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
        await sendEmail({
          to: user.email,
          subject: 'Verify your email address',
          text: `Click the link to verify your email address: ${url}`,
        });
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
          await sendEmail({
            to: email,
            subject: 'Your sign-in link',
            text: `Click the link to sign in: ${url}`,
          });
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

  // The admin plugin is framework-controlled - it backs the admin steps and
  // impersonation. A configured auth.userAdminRole registers a curated
  // access control (see buildAdminPlugin).
  options.plugins.push(buildAdminPlugin({ authConfig }));

  const { afterEmailVerification, databaseHooks, sendInvitationEmail } = buildHooks({
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

  // Organizations are always on. A bound "invitation.send" hook owns the
  // invitation email; unbound, the engine falls back to a stock template
  // through auth.email.
  options.plugins.push(
    buildOrganizationPlugin({
      authConfig,
      getAuth,
      sendInvitationEmail: sendInvitationEmail ?? createStockInvitationEmail({ sendEmail }),
    })
  );

  return options;
}

export default getBetterAuthConfig;
