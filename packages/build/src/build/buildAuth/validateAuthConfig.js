/* eslint-disable no-param-reassign */

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

import { isReserved, type } from '@lowdefy/helpers';
import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import lowdefySchema from '../../lowdefySchema.js';
import getAuthKeys from './getAuthKeys.js';
import isAuthConfigured from './isAuthConfigured.js';
import validateMutualExclusivity from './validateMutualExclusivity.js';

function validateSchema({ components }) {
  const { valid, errors } = validate({
    schema: lowdefySchema.definitions.authConfig,
    data: components.auth,
    returnErrors: true,
  });

  if (!valid) {
    // Only the first collected error is reported - one schema fault often
    // cascades into many ajv errors, and the first is the actionable one.
    const error = errors[0];
    // Try to get configKey from the item in the error path
    const instancePath = error.instancePath.split('/').filter(Boolean);
    let configKey = components.auth['~k'];
    let currentData = components.auth;

    for (const part of instancePath) {
      if (type.isArray(currentData)) {
        const index = parseInt(part, 10);
        currentData = currentData[index];
      } else {
        currentData = currentData?.[part];
      }
      if (currentData?.['~k']) {
        configKey = currentData['~k'];
      }
    }

    // Custom errorMessage strings in the schema are already complete
    // sentences - only raw ajv fallback messages need the Auth prefix.
    const message = error.keyword === 'errorMessage' ? error.message : `Auth ${error.message}.`;
    throw new ConfigError(message, { configKey });
  }
}

// Validation runs on any non-empty auth block and enforces that it forms a
// working auth setup. A block that sets auth options but doesn't cohere into
// one is a build error - there is no silent middle where partial auth config
// does nothing.
function validateAuthConfig({ components }) {
  if (type.isNone(components.auth)) {
    components.auth = {};
  }
  if (!type.isObject(components.auth)) {
    throw new ConfigError('lowdefy.auth is not an object.', { configKey: components['~k'] });
  }

  if (getAuthKeys({ components }).length === 0) {
    return components;
  }

  validateSchema({ components });

  // The checks below describe a runtime auth stack. A block whose only
  // substance is auth.dev declares none - it names the dev server's own
  // caller - so it is schema-checked (above) and stops here.
  if (!isAuthConfigured({ components })) {
    return components;
  }

  const auth = components.auth;
  const configKey = auth['~k'];

  const emailAndPasswordEnabled = auth.emailAndPassword?.enabled === true;
  const magicLinkEnabled = auth.magicLink?.enabled === true;
  const phoneNumberEnabled = auth.phoneNumber?.enabled === true;
  const hasProviders = type.isArray(auth.providers) && auth.providers.length > 0;
  const hasLoginMethod =
    emailAndPasswordEnabled || magicLinkEnabled || phoneNumberEnabled || hasProviders;
  const hasStrategies = type.isArray(auth.strategies) && auth.strategies.length > 0;

  // dev.mockUser is a server-dev-only bypass, never a mechanism: it cannot
  // satisfy this check for a block that also declares runtime auth keys.
  if (!hasLoginMethod && !hasStrategies) {
    throw new ConfigError(
      'Auth is configured without an authentication mechanism. Configure a login method ("emailAndPassword.enabled: true", "magicLink.enabled: true" or "phoneNumber.enabled: true"), or an OAuth provider in "providers", or an API auth strategy in "strategies".',
      { configKey }
    );
  }

  if (type.isNone(auth.secret)) {
    throw new ConfigError(
      'Auth "secret" is required when auth is configured. Reference it with the _secret operator.',
      { configKey }
    );
  }

  // A session-based mechanism (login method or OAuth provider) requires a
  // database for users, sessions and accounts.
  if (hasLoginMethod && type.isNone(auth.database)) {
    throw new ConfigError(
      'Auth "database" is required when a login method or provider is configured.',
      { configKey }
    );
  }

  // Duplicate ids silently last-win in downstream maps (trustedProviders,
  // runtime provider construction) - fail at build instead. Built-in
  // provider types allow one configuration each in BetterAuth; GenericOAuth
  // entries are keyed by id, so several may coexist.
  const seenProviderIds = {};
  const seenProviderTypes = {};
  (auth.providers ?? []).forEach((provider) => {
    const providerKey = provider['~k'] ?? configKey;
    // The provider id keys seenProviderIds below, a plain object: assigning
    // seenProviderIds['__proto__'] = true is a no-op, so two providers sharing
    // that id both pass the duplicate check. It also becomes the GenericOAuth
    // providerId the runtime resolves callbacks by.
    if (isReserved(provider.id)) {
      throw new ConfigError(
        `Auth provider id "${provider.id}" is a reserved name and cannot be used as an id.`,
        { configKey: providerKey }
      );
    }
    if (seenProviderIds[provider.id] === true) {
      throw new ConfigError(`Duplicate auth provider id "${provider.id}".`, {
        configKey: providerKey,
      });
    }
    seenProviderIds[provider.id] = true;
    if (provider.type !== 'GenericOAuth') {
      if (seenProviderTypes[provider.type] === true) {
        throw new ConfigError(
          `Auth provider type "${provider.type}" is configured more than once. BetterAuth supports one configuration per built-in provider; use GenericOAuth for additional configurations.`,
          { configKey: providerKey }
        );
      }
      seenProviderTypes[provider.type] = true;
    }
  });

  // An enabled phone login with no way to send codes is dead config - there
  // is no fallback SMS transport, so a "phone.otp.send" binding is required.
  // This runs on the merged hooks array (module contributions + app entries),
  // so a module-shipped binding satisfies it.
  if (phoneNumberEnabled) {
    const hasSendOtpBinding = (auth.hooks ?? []).some((hook) => hook.point === 'phone.otp.send');
    if (!hasSendOtpBinding) {
      throw new ConfigError(
        'Auth "phoneNumber" is enabled but no hook binds the "phone.otp.send" point. Bind an InternalApi endpoint in "auth.hooks" to send the OTP SMS.',
        { configKey: auth.phoneNumber['~k'] ?? configKey }
      );
    }
  }

  // The engine owns the two-factor challenge destination on every sign-in path -
  // Login navigates there on twoFactorRedirect, and the magic-link/OAuth
  // interception redirects there mid-flow. Routing by app config instead is
  // opt-in correctness on the sign-in path: a login page that omits the branch
  // leaves a 2FA-enrolled user unable to sign in at all, silently. So the page is
  // required whenever 2FA is enabled, not only when magic-link or OAuth are
  // configured. A module-contributed authPages.twoFactor satisfies this -
  // buildModuleAuth runs before buildAuth.
  if (auth.twoFactor?.enabled === true && type.isNone(auth.authPages?.twoFactor)) {
    throw new ConfigError(
      'Auth "authPages.twoFactor" is required when "twoFactor.enabled" is true. Set the page the engine routes a two-factor challenge to.',
      { configKey: auth.twoFactor['~k'] ?? configKey }
    );
  }

  if (auth.twoFactor?.required === true && type.isNone(auth.authPages?.twoFactorEnrol)) {
    throw new ConfigError(
      'Auth "authPages.twoFactorEnrol" is required when "twoFactor.required" is true. Every unenrolled user is redirected there, so a deployment requiring enrolment without the page redirects them to nowhere.',
      { configKey }
    );
  }

  // required: true is satisfied by a TOTP enrolment OR a registered passkey
  // (Decision 4), so either plugin is a sufficient enrolment route. Neither
  // present is a guaranteed lockout for every user, which no config should express.
  if (
    auth.twoFactor?.required === true &&
    auth.twoFactor?.enabled === false &&
    auth.passkey?.enabled !== true
  ) {
    throw new ConfigError(
      'Auth "twoFactor.required" is true but no second factor can be enrolled - "twoFactor.enabled" is false and passkeys are not enabled. Every user would be locked out with no way to satisfy the requirement.',
      { configKey }
    );
  }

  const requireEmailVerification = auth.emailAndPassword?.requireEmailVerification === true;
  if ((magicLinkEnabled || requireEmailVerification) && type.isNone(auth.email)) {
    throw new ConfigError(
      'Auth "email" is required when "magicLink" is enabled or "emailAndPassword.requireEmailVerification" is true.',
      { configKey }
    );
  }

  // An explicitly pinned deployment is the multi-app case, where silently
  // pinning the auto-seeded "default" org would point the app at the wrong
  // organization - the slug must be stated. An omitted block (or omitted
  // policy) is the single-org app, which defaults to the seeded org.
  if (auth.organizations?.policy === 'pinned' && type.isNone(auth.organizations.org)) {
    throw new ConfigError(
      'Auth "organizations.org" is required when "organizations.policy" is "pinned". Set the organization slug the deployment pins.',
      { configKey: auth.organizations['~k'] ?? configKey }
    );
  }
  if (auth.organizations?.policy === 'tenant' && !type.isNone(auth.organizations.org)) {
    throw new ConfigError(
      'Auth "organizations.org" applies only to the "pinned" policy - under "tenant" organizations are created per user at first session.',
      { configKey: auth.organizations['~k'] ?? configKey }
    );
  }
  if (auth.organizations?.policy === 'pinned' && !type.isNone(auth.organizations.create)) {
    throw new ConfigError(
      'Auth "organizations.create" applies only to the "tenant" policy - under "pinned" the active organization is ensured at startup, so there is no creation mode to set.',
      { configKey: auth.organizations['~k'] ?? configKey }
    );
  }

  // Under the tenant policy an MCP authorization has to ask which of the
  // member's organizations the grant acts in - the post-login page is where
  // that choice is made, so the authorization server cannot start without it.
  // Under pinned there is one organization and nothing to choose.
  if (
    !type.isNone(auth.oauthProvider) &&
    auth.organizations?.policy === 'tenant' &&
    type.isNone(auth.oauthProvider.postLoginPage)
  ) {
    throw new ConfigError(
      'Auth "oauthProvider.postLoginPage" is required when "organizations.policy" is "tenant". Set the page where a user chooses the organization an MCP authorization acts in.',
      { configKey: auth.oauthProvider['~k'] ?? configKey }
    );
  }

  validateMutualExclusivity({ components, entity: 'api' });
  validateMutualExclusivity({ components, entity: 'pages' });
  validateMutualExclusivity({ components, entity: 'websockets' });

  return components;
}

export default validateAuthConfig;
