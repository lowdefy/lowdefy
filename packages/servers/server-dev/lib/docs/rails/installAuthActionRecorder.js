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

// Serialized into the journey's page by page.evaluate, so this function must be
// pure: it may reference nothing but `window` and its argument.
//
// Starts recording the auth-engine actions the page executes. Every
// lowdefy._internal.auth method in `methods` is wrapped, once per document, to
// note its name in sessionStorage before it calls through: the engine's action
// methods look the method up on that object at call time, so a skipped action
// never reaches it and an executed one always does. sessionStorage, not a
// window variable, so a call that navigates (a sign-in) is still there to read
// from the next document. Clears what an earlier step recorded. Returns false
// when the page has no auth methods to wrap.
function installAuthActionRecorder({ key, methods }) {
  const auth = window.lowdefy?._internal?.auth;
  if (!auth) return false;
  if (!auth.__lowdefyAuthRecorder) {
    methods.forEach((name) => {
      const original = auth[name];
      if (typeof original !== 'function') return;
      auth[name] = function recordedAuthMethod(...args) {
        try {
          const called = JSON.parse(window.sessionStorage.getItem(key) ?? '[]');
          called.push(name);
          window.sessionStorage.setItem(key, JSON.stringify(called));
        } catch (error) {
          // A page with no storage cannot be recorded; the call still goes through.
        }
        return original.apply(this, args);
      };
    });
    Object.defineProperty(auth, '__lowdefyAuthRecorder', { value: true });
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    return false;
  }
  return true;
}

export default installAuthActionRecorder;
