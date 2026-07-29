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

import { createAuthClient } from 'better-auth/client';

// AuthConfigured.jsx depends on behaviours of better-auth's client internals
// that no public API documents:
//   1. authClient.$store.atoms.session is the real session store, and its
//      value exposes an awaitable refetch - the store's only writer.
//   2. A getSession path call never writes the store (/get-session is not in
//      the atomListeners matcher) - the defect refreshSession exists to work
//      around.
//   3. A failed refetch resolves normally (it never rejects) and writes the
//      error into the atom - why refreshSession reads { data, error } back
//      instead of using the refetch's return value.
//   4. The proxy fires a signal-driven background session fetch shortly
//      after a matched endpoint succeeds, aborting any refetch already in
//      flight, and fetchOptions.disableSignal suppresses it - the
//      sessionScoped mechanism, and why it is required rather than merely
//      awaiting the refetch.
// A better-auth upgrade that changes any of these breaks UpdateSession the
// way the original defect did - visibly only in a running app. These tests
// pin the contract so the break surfaces here instead.

const USER_1 = { id: 'user-1', email: 'user-1@example.com' };
const USER_2 = { id: 'user-2', email: 'user-2@example.com' };

function jsonResponse(payload, { status = 200 } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sessionPayload(user) {
  return { session: { id: 'session-1', userId: user.id }, user };
}

function createClient(handleGetSession) {
  const requests = [];
  const client = createAuthClient({
    baseURL: 'http://localhost:3000/api/auth',
    fetchOptions: {
      customFetchImpl: async (input, init) => {
        const url = String(input);
        requests.push({ url, init });
        if (url.includes('/get-session')) {
          if (handleGetSession) {
            return handleGetSession(url, init);
          }
          return jsonResponse(sessionPayload(USER_1));
        }
        return jsonResponse({ status: true });
      },
    },
  });
  // Mount the session atom with a never-removed subscription, mirroring the
  // app - Session's useSession() keeps it mounted, and mounting is what
  // makes the signal subscription live. It also keeps the store mounted for
  // bare .get() calls: on an unmounted onMount store, .get() temporarily
  // mounts it and schedules nanostores' delayed unmount on a timer that
  // outlives the jest worker. The mount's own initial fetch is skipped in
  // node (isServer), so no request is recorded here.
  client.$store.atoms.session.subscribe(() => {});
  const getSessionRequests = () => requests.filter((r) => r.url.includes('/get-session'));
  return { client, getSessionRequests };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('the session store is reachable at $store.atoms.session and exposes an awaitable refetch', () => {
  const { client } = createClient();
  const value = client.$store.atoms.session.get();
  expect(value).toMatchObject({ data: null, error: null, isPending: true });
  expect(typeof value.refetch).toBe('function');
});

test('a getSession path call resolves the session without ever writing the store', async () => {
  const { client } = createClient();
  const sessionAtom = client.$store.atoms.session;
  const { data } = await client.getSession({ query: { disableCookieCache: true } });
  expect(data.user).toEqual(USER_1);
  expect(sessionAtom.get().data).toBe(null);
});

test('an awaited refetch writes the store before resolving, carrying the disableCookieCache query', async () => {
  const { client, getSessionRequests } = createClient();
  const sessionAtom = client.$store.atoms.session;
  const result = await sessionAtom.get().refetch({ query: { disableCookieCache: true } });
  // The refetch resolves to undefined - its outcome is only readable from
  // the atom, which is why refreshSession returns the atom's { data, error }.
  expect(result).toBeUndefined();
  const { data, error, isPending } = sessionAtom.get();
  expect(data.user).toEqual(USER_1);
  expect(error).toBe(null);
  expect(isPending).toBe(false);
  expect(getSessionRequests()).toHaveLength(1);
  expect(getSessionRequests()[0].url).toContain('disableCookieCache=true');
});

test('a failed refetch resolves normally and writes the error into the atom', async () => {
  const { client } = createClient(() =>
    jsonResponse({ message: 'Internal error.' }, { status: 500 })
  );
  const sessionAtom = client.$store.atoms.session;
  await expect(sessionAtom.get().refetch()).resolves.toBeUndefined();
  const { error } = sessionAtom.get();
  expect(error).not.toBe(null);
  expect(error.status).toBe(500);
});

test('a matched endpoint fires one background session refetch shortly after success', async () => {
  const { client, getSessionRequests } = createClient();
  await client.changePassword({ currentPassword: 'old', newPassword: 'new' });
  expect(getSessionRequests()).toHaveLength(0);
  // The proxy flips $sessionSignal on a 10ms setTimeout after success.
  await wait(100);
  expect(getSessionRequests()).toHaveLength(1);
});

test('fetchOptions.disableSignal suppresses the background refetch - the sessionScoped mechanism', async () => {
  const { client, getSessionRequests } = createClient();
  await client.changePassword({
    currentPassword: 'old',
    newPassword: 'new',
    fetchOptions: { disableSignal: true },
  });
  await wait(100);
  expect(getSessionRequests()).toHaveLength(0);
});

test('a competing session fetch aborts an in-flight refetch, which resolves having written nothing', async () => {
  let getSessionCalls = 0;
  const { client } = createClient((url, init) => {
    getSessionCalls += 1;
    if (getSessionCalls === 1) {
      // The first refetch's request: rejects on abort like a real fetch,
      // with a slow success fallback so the test stays deterministic even
      // if the abort signal is not forwarded - the aborted-controller check
      // must prevent the write either way.
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(jsonResponse(sessionPayload(USER_1))), 80);
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('aborted'));
        });
      });
    }
    return jsonResponse(sessionPayload(USER_2));
  });
  const sessionAtom = client.$store.atoms.session;
  const first = sessionAtom.get().refetch({ query: { disableCookieCache: true } });
  const second = sessionAtom.get().refetch();
  await expect(first).resolves.toBeUndefined();
  await second;
  // Only the second fetch's write landed - the first was aborted mid-flight
  // and wrote nothing, which is why UpdateSession must be the only session
  // refresher for its awaited refetch to mean anything.
  expect(sessionAtom.get().data.user).toEqual(USER_2);
});
