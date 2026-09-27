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
// reading the winner's row. The mint refuses to run without
// them (createActiveOrgPolicyHook), so a race can never leave a user owning
// two organizations or holding two owner rows.
//
// The indexes are created at startup, by the running server against the
// database it serves, rather than by a build or CLI step: the build has no
// database access, a CLI step is one more thing each environment has to
// remember, and both would miss a database swapped under a running app.
// Creating an index that exists is a no-op, so the cost is a read of each
// collection's indexes once per process.
//
// The adapter owns the mapping to physical collections and fields, so this is
// an adapter capability (adapter.options.ensureUniqueIndexes, implemented by
// MongoDBAuthAdapter). An adapter without it is warned about once - its
// database must enforce the same uniqueness some other way.
const uniqueIndexes = [
  { model: 'organization', fields: ['slug'] },
  { model: 'member', fields: ['userId', 'organizationId'] },
];

const ensuredByAuth = new WeakMap();

async function ensure({ auth, logger }) {
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
    // An unreachable database is an outage, not a missing index.
    if (ServiceError.isServiceError(error)) {
      throw new ServiceError(undefined, { cause: error, service: 'Auth database' });
    }
    throw new ConfigError(
      `The auth database is missing a unique index Lowdefy needs to keep organizations and memberships consistent, and it could not be created: ${error.message} Remove duplicate rows, or create the index with a database user that is allowed to, then restart the server.`,
      { cause: error }
    );
  }
}

function ensureAuthIndexes({ auth, logger }) {
  if (!ensuredByAuth.has(auth)) {
    ensuredByAuth.set(
      auth,
      ensure({ auth, logger }).catch((error) => {
        // Not memoized - the next caller retries once the data or the
        // connection is fixed.
        ensuredByAuth.delete(auth);
        throw error;
      })
    );
  }
  return ensuredByAuth.get(auth);
}

export default ensureAuthIndexes;
