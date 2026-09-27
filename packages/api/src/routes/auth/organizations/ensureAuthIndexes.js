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

import { ConfigError, ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The auth invariants the engine's own writes rely on but BetterAuth only
// checks by reading first: one organization per slug (the pinned ensure and
// the tenant signup mint find-or-create by slug) and one member row per
// (user, organization) (the mint and the open-signup joins check for the row
// before writing it). Two concurrent writers can both pass the read; a unique
// index turns the second write into an error the caller recovers from by
// reading the winner's row. The mint refuses to run without them
// (createActiveOrgPolicyHook), so a race can never leave a user owning two
// organizations or holding two owner rows.
//
// The indexes are created at startup, by the running server against the
// database it serves, rather than by a build or CLI step: the build has no
// database access, a CLI step is one more thing each environment has to
// remember, and both would miss a database swapped under a running app. The
// adapter reads the existing indexes first and only creates missing ones.
//
// The mint awaits the same call. Once the indexes are in place the result is
// kept for the life of the process, so a mint costs no database read. When an
// attempt fails - duplicate rows block the index build, the database user may
// not create indexes, the database is unreachable - the failure is logged once
// and kept for a cool-down: every mint in that window is refused at once,
// without touching the database, so repeated sign-ins can not trigger repeated
// index builds. The first mint after the cool-down retries (read, and create
// what is still missing), so fixing the data or creating the index by hand
// recovers without a restart.
//
// The adapter owns the mapping to physical collections and fields, so this is
// an adapter capability (adapter.options.ensureUniqueIndexes, implemented by
// MongoDBAuthAdapter). An adapter without it is warned about once - its
// database must enforce the same uniqueness some other way.
const uniqueIndexes = [
  { model: 'organization', fields: ['slug'] },
  { model: 'member', fields: ['userId', 'organizationId'] },
];

const coolDownMs = 30000;

const stateByAuth = new WeakMap();

async function attempt({ auth, logger }) {
  const { adapter } = await auth.$context;
  const ensureUniqueIndexes = adapter.options?.ensureUniqueIndexes;
  if (!type.isFunction(ensureUniqueIndexes)) {
    logger.warn(
      `Auth database adapter "${adapter.id}" can not create indexes. Make sure its database enforces a unique organization slug and one member row per user and organization, or two concurrent sign-ins can create duplicate organizations or owner rows.`
    );
    return;
  }
  try {
    await ensureUniqueIndexes({ indexes: uniqueIndexes });
  } catch (error) {
    let failure;
    if (ServiceError.isServiceError(error)) {
      // An unreachable database is an outage, not a missing index.
      failure = new ServiceError(undefined, { cause: error, service: 'Auth database' });
    } else {
      failure = new ConfigError(
        `The auth database is missing a unique index Lowdefy needs to keep organizations and memberships consistent, and it could not be created: ${
          error.message
        } Remove duplicate rows, or create the index with a database user that is allowed to. New organizations are refused until then; the server retries every ${
          coolDownMs / 1000
        } seconds while sign-ins need one.`,
        { cause: error }
      );
    }
    logger.error({ err: failure }, failure.message);
    throw failure;
  }
}

function ensureAuthIndexes({ auth, logger }) {
  const state = stateByAuth.get(auth);
  if (state?.status === 'ready') {
    return Promise.resolve();
  }
  if (state?.status === 'pending') {
    return state.promise;
  }
  if (state?.status === 'failed' && Date.now() - state.failedAt < coolDownMs) {
    return Promise.reject(state.error);
  }
  const next = { status: 'pending' };
  next.promise = attempt({ auth, logger }).then(
    () => {
      next.status = 'ready';
    },
    (error) => {
      next.status = 'failed';
      next.failedAt = Date.now();
      next.error = error;
      throw error;
    }
  );
  stateByAuth.set(auth, next);
  return next.promise;
}

export default ensureAuthIndexes;
