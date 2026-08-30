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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import handleRequest from '../endpoints/handleRequest.js';

// The ledger lives in the app's own database (design D2). It is read and
// written through the SAME request machinery a migration step uses —
// synthesised MongoDB* request steps run through handleRequest — so there is
// no second data path to the database. The ledger connection is a
// MongoDBCollection connection the app declares; every ledger access is
// tenant: none, because the ledger is app-global bookkeeping, not tenant data.
//
// The lock is a reserved document (_id: LOCK_ID) in the same collection
// (design D9): one advisory lock, taken with an expiry so a crashed run does
// not wedge the app.
const LOCK_ID = '$lock';

function freshRoutineContext() {
  return {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
  };
}

async function callLedgerRequest(context, { connectionId, stepId, type: requestType, properties }) {
  const routineContext = freshRoutineContext();
  const request = {
    id: `request:__migrations__:${stepId}`,
    stepId,
    endpointId: '__migrations__',
    type: requestType,
    connectionId,
    tenant: 'none',
    properties,
  };
  await handleRequest(context, routineContext, { request });
  return routineContext.steps[stepId];
}

function createMongoLedger(context, { connectionId, lockTimeoutMs = 900000 } = {}) {
  if (!type.isString(connectionId) || connectionId === '') {
    throw new ConfigError(
      'The migrations ledger connection id is missing. Set config.migrations.ledgerConnectionId to the id of a MongoDBCollection connection, or declare a connection with id "migrations".'
    );
  }

  async function readApplied() {
    const result = await callLedgerRequest(context, {
      connectionId,
      stepId: 'read_applied',
      type: 'MongoDBFind',
      properties: { query: { _id: { $ne: LOCK_ID } } },
    });
    return type.isArray(result) ? result : [];
  }

  async function readLock() {
    const result = await callLedgerRequest(context, {
      connectionId,
      stepId: 'read_lock',
      type: 'MongoDBFind',
      properties: { query: { _id: LOCK_ID } },
    });
    return type.isArray(result) && result.length > 0 ? result[0] : null;
  }

  async function insertEntry(entry) {
    await callLedgerRequest(context, {
      connectionId,
      stepId: 'insert_entry',
      type: 'MongoDBInsertOne',
      properties: { doc: { _id: entry.id, ...entry } },
    });
  }

  function isHeld(lock) {
    if (type.isNone(lock) || type.isNone(lock.expiresAt)) {
      return false;
    }
    const expiresAt = lock.expiresAt instanceof Date ? lock.expiresAt.getTime() : Date.parse(lock.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }

  // Advisory lock: a held-and-fresh lock is a hard stop naming the holder; an
  // absent or expired lock is taken (expired = the previous run crashed, so it
  // is stolen with a warning). A residual read→write race is why the lock
  // carries an expiry and is heartbeat-refreshed rather than trusted forever.
  async function acquireLock({ holder }) {
    const existing = await readLock();
    if (isHeld(existing)) {
      throw new ConfigError(
        `A migration lock is held by "${existing.holder}" since ${
          existing.acquiredAt ?? 'unknown'
        }. Another migration run is in progress. Wait for it to finish, or if it crashed wait for the lock to expire (config.migrations.lockTimeoutMs).`
      );
    }
    if (!type.isNone(existing)) {
      context.logger.warn(
        `Stole an expired migration lock held by "${existing.holder}" since ${existing.acquiredAt} — the previous run likely crashed.`
      );
    }
    const now = Date.now();
    await callLedgerRequest(context, {
      connectionId,
      stepId: 'acquire_lock',
      type: 'MongoDBUpdateOne',
      properties: {
        filter: { _id: LOCK_ID },
        update: {
          $set: {
            holder,
            acquiredAt: new Date(now),
            expiresAt: new Date(now + lockTimeoutMs),
          },
        },
        options: { upsert: true },
      },
    });
    return { holder };
  }

  async function refreshLock({ holder }) {
    const now = Date.now();
    await callLedgerRequest(context, {
      connectionId,
      stepId: 'refresh_lock',
      type: 'MongoDBUpdateOne',
      properties: {
        filter: { _id: LOCK_ID, holder },
        update: { $set: { expiresAt: new Date(now + lockTimeoutMs) } },
      },
    });
  }

  async function releaseLock({ holder }) {
    await callLedgerRequest(context, {
      connectionId,
      stepId: 'release_lock',
      type: 'MongoDBDeleteOne',
      properties: { filter: { _id: LOCK_ID, holder } },
    });
  }

  return { readApplied, readLock, insertEntry, acquireLock, refreshLock, releaseLock, isHeld };
}

export { LOCK_ID };
export default createMongoLedger;
