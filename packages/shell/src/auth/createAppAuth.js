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

import { AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import createAuthApi from './createAuthApi.js';
import createCoreAuth from './createCoreAuth.js';
import createSessionStores from './createSessionStores.js';
import createTokenStore from './createTokenStore.js';
import getAuthSettings from './getAuthSettings.js';
import isBackgroundShell from './isBackgroundShell.js';
import purgeAppData from './purgeAppData.js';
import shouldLock from './shouldLock.js';
import signInWithSheet from './signInWithSheet.js';
import unregisterPushToken from './unregisterPushToken.js';
import usesBiometricUnlock from './usesBiometricUnlock.js';
import watchSession from './watchSession.js';

/**
 * Sign-in, unlock and sign-out for one app in the shell, and its session token.
 *
 * State, read with getState and followed with subscribe:
 * - `status`: 'starting' while the token is read, 'locked' behind the lock screen, else 'open'.
 * - `hasToken`: someone is signed in.
 * - `settings`: the app's mobile.auth (getAuthSettings), null for an app without auth; the last
 *   ones the server sent, kept on the device so a lock or a shared-device sign-out applies before
 *   the app's server answers.
 * - `slug`: the app's slug, which names its storage keys.
 *
 * The session ends when the token is cleared anywhere (a 401, a Logout action, the shell's own
 * sign-out): everything the app kept for the person is removed (purgeAppData) and onSignedOut
 * opens the app afresh, with nothing of theirs left in memory either.
 *
 * @param {Object} params
 * @param {string} params.apiBase The app server's URL.
 * @param {{ id, name }} params.app The app, from shell.json.
 * @param {Object} params.cacheStore The page cache.
 * @param {Function} params.fetch The shell's fetch (shell header, no cookies).
 * @param {{ get, set, remove, keys }} params.kv The device store.
 * @param {Function} params.onSignedOut Called once the person's data is gone.
 * @param {Object} params.queueStore The offline request queue, cleared with the rest.
 * @param {{ id, scheme, profile }} params.shell The shell config.
 * @param {Function} params.streamFetch The shell's streaming fetch (expo/fetch, sent as fetch is),
 *   watched the same way: a chat stream answered 401 ends the session too.
 */
function createAppAuth({
  apiBase,
  app,
  appState = AppState,
  cacheStore,
  fetch,
  kv,
  localAuthentication = LocalAuthentication,
  now = Date.now,
  onSignedOut,
  queueStore,
  shell,
  streamFetch,
}) {
  const storedKey = `lowdefy-shell:auth:${app.id}`;
  const stored = JSON.parse(kv.get(storedKey) ?? 'null');
  let state = {
    status: 'starting',
    hasToken: false,
    settings: stored?.settings ?? null,
    slug: stored?.slug ?? null,
  };
  const listeners = new Set();
  const cleanups = [];
  let session = null;
  let sessionStarted = false;
  let lastRoot = null;
  let backgroundedAt = null;
  let ending = false;

  const tokenStore = createTokenStore({
    appId: app.id,
    background: isBackgroundShell(shell),
    getBiometric: () => usesBiometricUnlock(state.settings),
    kv,
  });
  const authApi = createAuthApi({ apiBase, fetch, tokenStore });

  function getState() {
    return state;
  }

  function setState(update) {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function dispose() {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  }

  function getAppName() {
    return session?.getState().root?.lowdefyApp?.name ?? app.name;
  }

  function rememberRoot() {
    const { root } = session.getState();
    if (root === null || root === lastRoot) {
      return;
    }
    lastRoot = root;
    const update = { settings: getAuthSettings(root), slug: root.lowdefyApp?.slug ?? null };
    kv.set(storedKey, JSON.stringify(update));
    setState(update);
  }

  function open() {
    setState({ status: 'open', hasToken: tokenStore.get() !== null });
    if (!sessionStarted) {
      sessionStarted = true;
      session.start();
    }
  }

  async function endSession({ callServer }) {
    if (ending) {
      return;
    }
    ending = true;
    dispose();
    const token = tokenStore.get();
    if (callServer && token !== null) {
      // Never waited on: offline, the session still ends on the phone. The push token goes first,
      // while the session can still name whose it is.
      unregisterPushToken({ app: { apiBase, fetch, session, shell, tokenStore } })
        .catch(() => {})
        .finally(() => authApi.signOut({ token }).catch(() => {}));
    }
    await purgeAppData({
      appId: app.id,
      cacheStore,
      kv,
      queueStore,
      slug: state.slug,
      tokenStore,
    });
    onSignedOut();
  }

  function signOut() {
    return endSession({ callServer: true });
  }

  function lock() {
    // A token behind biometrics is read again, with its prompt, to unlock.
    if (tokenStore.isProtected()) {
      tokenStore.unload();
    }
    setState({ status: 'locked' });
  }

  // True once unlocked. A cancelled or failed prompt leaves the app locked.
  async function unlock() {
    if (tokenStore.isProtected()) {
      try {
        await tokenStore.load();
      } catch (error) {
        return false;
      }
      if (tokenStore.get() === null) {
        await endSession({ callServer: false });
        return false;
      }
      open();
      return true;
    }
    const result = await localAuthentication.authenticateAsync({
      promptMessage: `Unlock ${getAppName()}`,
    });
    if (!result.success) {
      return false;
    }
    open();
    return true;
  }

  function handleAppStateChange(next) {
    if (next === 'background') {
      backgroundedAt = now();
      // A shared device signs out on every close.
      if (state.settings?.sharedDevice === true && tokenStore.get() !== null) {
        signOut();
      }
      return;
    }
    if (next !== 'active') {
      return;
    }
    const locks =
      state.status === 'open' &&
      state.hasToken &&
      usesBiometricUnlock(state.settings) &&
      shouldLock({ backgroundedAt, now: now(), unlockAfter: state.settings.unlockAfter });
    backgroundedAt = null;
    if (locks) {
      lock();
    }
  }

  function handleTokenChange(token) {
    if (token === null) {
      endSession({ callServer: false });
    }
  }

  // The session moves onto the new caller before the screens hear of the token, so no page of
  // the signed-out caller shows in between: handleCallerChanged shows loading at once.
  function completeSignIn(result) {
    if (result.status === 'signedIn') {
      session.handleCallerChanged();
      setState({ hasToken: true });
    }
    return result;
  }

  async function start({ session: appSession }) {
    session = appSession;
    cleanups.push(tokenStore.subscribe(handleTokenChange));
    const appStateSubscription = appState.addEventListener('change', handleAppStateChange);
    cleanups.push(() => appStateSubscription.remove());
    cleanups.push(session.subscribe(rememberRoot));
    const sharedDevice = state.settings?.sharedDevice === true;
    if (tokenStore.isProtected()) {
      if (sharedDevice) {
        // A token stored behind biometrics before the app became a shared device: it is never
        // unlocked into, and its sign-out needs no prompt.
        await signOut();
        return;
      }
      setState({ status: 'locked' });
      return;
    }
    await tokenStore.load();
    const signedIn = tokenStore.get() !== null;
    if (signedIn && sharedDevice) {
      // A shared phone whose app was killed without going to the background first.
      await signOut();
      return;
    }
    if (signedIn && usesBiometricUnlock(state.settings)) {
      setState({ status: 'locked' });
      return;
    }
    open();
  }

  const sessionStores = createSessionStores({ cacheStore, isEnded: () => ending, kv });

  function watch(baseFetch) {
    return watchSession({
      fetch: baseFetch,
      onRefused: () => {
        const { cacheKey } = session.getState();
        if (cacheKey !== null) {
          cacheStore.removeEntry({ cacheKey });
        }
      },
      onSessionEnded: () => tokenStore.clear(),
    });
  }
  const watchedFetch = watch(fetch);

  const coreAuth = createCoreAuth({
    apiBase,
    fetch: watchedFetch,
    getSession: () => session,
    tokenStore,
  });

  return {
    // The auth client the core's auth actions call (createCoreAuth).
    coreAuth,
    dispose,
    fetch: watchedFetch,
    getAppName,
    // What the app's session reads and writes through (createSessionStores).
    sessionStores,
    getState,
    sendCode: ({ email }) => authApi.sendCode({ email }),
    signInWithCode: async ({ email, otp }) =>
      completeSignIn(await authApi.signInWithCode({ email, otp })),
    signInWithSheet: async () => completeSignIn(await signInWithSheet({ apiBase, authApi, shell })),
    signOut,
    start,
    // The streaming fetch blocks call through (the host's streamFetch).
    streamFetch: watch(streamFetch),
    subscribe,
    tokenStore,
    unlock,
  };
}

export default createAppAuth;
