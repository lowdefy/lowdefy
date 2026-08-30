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

import runMigrations from './runMigrations.js';

function testContext() {
  return {
    rid: 'test-rid',
    appMeta: { version: '8.0.0' },
    config: {},
    // Pre-set so runMigrations does not build a real evaluateOperators.
    evaluateOperators: () => ({}),
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  };
}

function fakeLedger({ applied = [], lockHeld = false } = {}) {
  const calls = { inserted: [], acquired: 0, released: 0 };
  return {
    calls,
    readApplied: async () => applied,
    readLock: async () => (lockHeld ? { holder: 'other', expiresAt: new Date(Date.now() + 100000) } : null),
    isHeld: () => lockHeld,
    acquireLock: async () => {
      calls.acquired += 1;
    },
    refreshLock: async () => {},
    releaseLock: async () => {
      calls.released += 1;
    },
    insertEntry: async (entry) => {
      calls.inserted.push(entry);
    },
  };
}

const index = [
  { id: 'm1', checksum: 'a1' },
  { id: 'm2', checksum: 'b2' },
];

test('runMigrations applies every pending migration in order and records the ledger', async () => {
  const ledger = fakeLedger();
  const ran = [];
  const result = await runMigrations(testContext(), {
    options: {},
    deps: {
      readIndex: async () => index,
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        return { status: 'continue', documents: 5 };
      },
    },
  });
  expect(ran).toEqual(['m1', 'm2']);
  expect(ledger.calls.acquired).toBe(1);
  expect(ledger.calls.released).toBe(1);
  expect(ledger.calls.inserted.map((e) => e.id)).toEqual(['m1', 'm2']);
  expect(ledger.calls.inserted[0]).toMatchObject({ checksum: 'a1', status: 'applied', documents: 5 });
  expect(result.applied.map((a) => a.id)).toEqual(['m1', 'm2']);
  expect(result.failed).toBeNull();
});

test('runMigrations skips applied migrations', async () => {
  const ledger = fakeLedger({ applied: [{ _id: 'm1', checksum: 'a1' }] });
  const ran = [];
  await runMigrations(testContext(), {
    deps: {
      readIndex: async () => index,
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        return { status: 'continue', documents: 0 };
      },
    },
  });
  expect(ran).toEqual(['m2']);
});

test('runMigrations does nothing and takes no lock when there are no pending migrations', async () => {
  const ledger = fakeLedger({ applied: [{ _id: 'm1', checksum: 'a1' }, { _id: 'm2', checksum: 'b2' }] });
  const result = await runMigrations(testContext(), {
    deps: { readIndex: async () => index, ledger, runMigration: async () => ({ status: 'continue' }) },
  });
  expect(ledger.calls.acquired).toBe(0);
  expect(result.applied).toEqual([]);
});

test('runMigrations stops at a failing migration, releases the lock, and leaves its ledger entry absent', async () => {
  const ledger = fakeLedger();
  const ran = [];
  const result = await runMigrations(testContext(), {
    deps: {
      readIndex: async () => index,
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        if (migration.id === 'm1') {
          return { status: 'error', error: new Error('boom'), documents: 0 };
        }
        return { status: 'continue', documents: 0 };
      },
    },
  });
  expect(ran).toEqual(['m1']);
  expect(ledger.calls.inserted).toEqual([]);
  expect(ledger.calls.released).toBe(1);
  expect(result.failed).toEqual({ id: 'm1', message: 'boom' });
});

test('runMigrations --dry-run reports pending without acquiring the lock or writing', async () => {
  const ledger = fakeLedger();
  const result = await runMigrations(testContext(), {
    options: { dryRun: true },
    deps: { readIndex: async () => index, ledger, runMigration: async () => ({ status: 'continue' }) },
  });
  expect(result.dryRun).toBe(true);
  expect(result.pending.map((m) => m.id)).toEqual(['m1', 'm2']);
  expect(ledger.calls.acquired).toBe(0);
  expect(ledger.calls.inserted).toEqual([]);
});

test('runMigrations throws on a checksum mismatch unless allowChecksumMismatch is set', async () => {
  const ledger = fakeLedger({ applied: [{ _id: 'm1', checksum: 'CHANGED' }] });
  await expect(
    runMigrations(testContext(), {
      deps: { readIndex: async () => index, ledger, runMigration: async () => ({ status: 'continue' }) },
    })
  ).rejects.toThrow('have changed since they were applied');
});

test('runMigrations proceeds past a checksum mismatch with allowChecksumMismatch', async () => {
  const ledger = fakeLedger({ applied: [{ _id: 'm1', checksum: 'CHANGED' }] });
  const ran = [];
  await runMigrations(testContext(), {
    options: { allowChecksumMismatch: true },
    deps: {
      readIndex: async () => index,
      ledger,
      runMigration: async (m) => {
        ran.push(m.id);
        return { status: 'continue', documents: 0 };
      },
    },
  });
  // m1 is applied (mismatch tolerated), so only m2 runs.
  expect(ran).toEqual(['m2']);
});
