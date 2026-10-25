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

import { createHash, randomBytes } from 'node:crypto';

import { type } from '@lowdefy/helpers';

import getSignInTokenScopes from './support/getSignInTokenScopes.js';
import normalizeSignInTokenLanding from './support/normalizeSignInTokenLanding.js';

// A link in an inbox is a credential for as long as it works, so it works for a
// short time: an hour unless the routine says otherwise, a week at most.
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60;
const MAX_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

// Creates a sign-in token for a known person in an organization, to put into an
// app email so a tap on a link signs them in instead of sending a second
// sign-in email. The token is returned here and nowhere else: only its SHA-256
// is stored. It is marked as a credential, so no log line of the request prints
// it.
//
// The token is single-use and single-purpose: it is spent on its first
// successful exchange, and it is bound here to its user, organization, scope and
// landing - the exchange always lands on that landing, whatever the caller asks.
// An email with several links mints one token per link. It is spent only by a
// POST to the exchange endpoint (the SignInWithToken action), never by a GET.
// The session it opens carries the scope, and its roles narrow to the roles
// auth.sessionScopes declares for that scope that the person also holds.
//
// A caller-less step: it mints a credential for someone else, so it runs only
// where the run itself is trusted (a cron or an InternalApi routine with
// system: true), never for a signed-in caller.
//
// The token records the member row it was made for: the exchange accepts it only
// while that row stands, so leaving, removal or deletion ends it.
async function CreateSignInToken({
  auth,
  markCredential,
  organization,
  properties,
  readConfigFile,
}) {
  const scopes = getSignInTokenScopes({ auth });
  if (type.isNone(scopes)) {
    throw new Error(
      'CreateSignInToken needs a session scope - declare one under "auth.sessionScopes". A sign-in token opens a session limited to its scope, so without a scope there is nothing to mint.'
    );
  }
  const {
    userId,
    organizationId,
    expiresIn = DEFAULT_EXPIRES_IN_SECONDS,
    scope,
    landing,
  } = properties ?? {};
  ['userId', 'organizationId', 'scope'].forEach((name) => {
    if (!type.isString(properties?.[name]) || properties[name] === '') {
      throw new Error(`CreateSignInToken requires a non-empty string "${name}" property.`);
    }
  });
  if (!(type.isInt(expiresIn) && expiresIn > 0 && expiresIn <= MAX_EXPIRES_IN_SECONDS)) {
    throw new Error(
      `CreateSignInToken "expiresIn" must be a positive whole number of seconds, at most ${MAX_EXPIRES_IN_SECONDS} (7 days). Received ${JSON.stringify(
        expiresIn
      )}.`
    );
  }
  if (!scopes.includes(scope)) {
    throw new Error(
      `CreateSignInToken scope "${scope}" is not declared in "auth.sessionScopes". Declared scopes: ${scopes.join(
        ', '
      )}.`
    );
  }
  // Under pinned, the exchange accepts only the pinned organization's tokens,
  // so a token for another one would go out in an email and never work.
  if (
    organization?.policy === 'pinned' &&
    !type.isNone(organization.pinned) &&
    organizationId !== organization.pinned.id
  ) {
    throw new Error(
      `CreateSignInToken refused - organization "${organizationId}" is not this app's pinned organization "${organization.pinned.id}".`
    );
  }
  const routes = type.isNone(landing?.pageId) ? null : await readConfigFile('routes.json');
  const boundLanding = normalizeSignInTokenLanding({ landing, routes });
  const { adapter } = await auth.$context;
  const user = await adapter.findOne({ model: 'user', where: [{ field: 'id', value: userId }] });
  if (type.isNone(user)) {
    throw new Error(`CreateSignInToken found no user "${userId}".`);
  }
  if (
    user.banned === true &&
    (type.isNone(user.banExpires) || new Date(user.banExpires) > new Date())
  ) {
    throw new Error(`CreateSignInToken refused - user "${userId}" is banned.`);
  }
  // The exchange cannot challenge for a second factor, so a token for an enrolled
  // person would only ever be refused. Refusing here lets the routine send an
  // ordinary link instead.
  if (user.twoFactorEnabled === true) {
    throw new Error(
      `CreateSignInToken refused - user "${userId}" has a second factor enrolled, and a sign-in token can not satisfy it. Send an ordinary link instead.`
    );
  }
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: userId },
      { field: 'organizationId', value: organizationId },
    ],
  });
  if (type.isNone(member)) {
    throw new Error(
      `CreateSignInToken refused - user "${userId}" has no member row in organization "${organizationId}".`
    );
  }
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + expiresIn * 1000);
  const token = `ldf_sit_${randomBytes(32).toString('base64url')}`;
  markCredential(token);
  await adapter.create({
    model: 'signInToken',
    data: {
      organizationId,
      userId,
      memberId: member.id,
      scope,
      landing: JSON.stringify(boundLanding),
      state: 'issued',
      hash: createHash('sha256').update(token).digest('hex'),
      createdAt,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

CreateSignInToken.meta = { authority: { scope: 'system' } };

export default CreateSignInToken;
