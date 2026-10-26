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

/**
 * Waits until the open app can act for its caller: the auth has read the token and is open (not
 * starting, not locked) and the session holds a root. Launch work (a notification button, a quick
 * action, share-in, the queue's replay, background fetch) waits on it, so none of it runs with no
 * token loaded or no root to read.
 *
 * @param {Object} params
 * @param {Object} params.auth The app's auth (createAppAuth).
 * @param {Object} params.session The app's session (createAppSession).
 * @returns {{ promise: Promise<void>, stop: () => void }} stop stops waiting; the promise then never
 *   settles.
 */
function whenAppReady({ auth, session }) {
  const unsubscribes = [];
  const stop = () => unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
  const promise = new Promise((resolve) => {
    function check() {
      if (auth.getState().status === 'open' && session.getState().root !== null) {
        stop();
        resolve();
        return true;
      }
      return false;
    }
    if (!check()) {
      unsubscribes.push(auth.subscribe(check), session.subscribe(check));
    }
  });
  return { promise, stop };
}

export default whenAppReady;
