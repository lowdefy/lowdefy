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

import { vi } from 'vitest';

// An in-memory auth database holding the unique indexes ensureAuthIndexes
// creates - one organization per slug, one member row per (user, org) - so the
// mint's recovery from a lost race runs against the same rejection a real
// database gives. `before` pauses an operation until the test releases it,
// which fixes the interleaving of two concurrent sessions.
function createMemoryAuth({ organizations = [], members = [], ensureUniqueIndexes } = {}) {
  const db = { organization: [...organizations], member: [...members] };
  const pauses = [];
  let ids = 0;
  function matches(row, where) {
    return where.every(({ field, value, operator }) =>
      operator === 'ne' ? row[field] !== value : row[field] === value
    );
  }
  async function pause(operation, args) {
    const found = pauses.find((entry) => entry.match(operation, args));
    if (found) {
      pauses.splice(pauses.indexOf(found), 1);
      found.reached();
      await found.released;
    }
  }
  const adapter = {
    options: {
      ensureUniqueIndexes: ensureUniqueIndexes ?? vi.fn(async () => {}),
    },
    findOne: vi.fn(async ({ model, where }) => {
      await pause('findOne', { model, where });
      return db[model].find((row) => matches(row, where)) ?? null;
    }),
    findMany: vi.fn(async ({ model, where }) => {
      if (model === 'invitation') return [];
      return db[model].filter((row) => matches(row, where));
    }),
    create: vi.fn(async ({ model, data }) => {
      await pause('create', { model, data });
      const duplicate =
        model === 'organization'
          ? db.organization.some((row) => row.slug === data.slug)
          : db.member.some(
              (row) => row.userId === data.userId && row.organizationId === data.organizationId
            );
      if (duplicate) {
        throw new Error(`E11000 duplicate key error collection: ${model}`);
      }
      ids += 1;
      const row = { id: `${model}_${ids}`, ...data };
      db[model].push(row);
      return { ...row };
    }),
    count: vi.fn(async ({ model, where }) => db[model].filter((row) => matches(row, where)).length),
    update: vi.fn(async ({ model, where, update }) => {
      const row = db[model].find((candidate) => matches(candidate, where));
      Object.assign(row, update);
      return { ...row };
    }),
  };
  const internalAdapter = {
    findUserById: vi.fn(async (id) => ({ id, email: `${id}@example.com`, name: 'User One' })),
  };
  const auth = { $context: Promise.resolve({ adapter, internalAdapter }) };
  // Pause the next operation matching `match` until release() is called;
  // reached resolves once a session is waiting there.
  function before(match) {
    const entry = { match };
    const reached = new Promise((resolve) => {
      entry.reached = resolve;
    });
    let release;
    entry.released = new Promise((resolve) => {
      release = resolve;
    });
    pauses.push(entry);
    return { reached, release };
  }
  return { auth, adapter, db, before };
}

export default createMemoryAuth;
