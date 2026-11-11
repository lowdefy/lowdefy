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

// The context.waitUntil of a data-session request: background work (scheduleBackground, the detached
// dispatch and the detached run) is added to the session's work set, so closing the session waits
// for it before it drops the database.
function trackSessionWork({ session }) {
  return function waitUntil(promise) {
    session.work.add(promise);
    const remove = () => {
      session.work.delete(promise);
    };
    promise.then(remove, remove);
  };
}

export default trackSessionWork;
