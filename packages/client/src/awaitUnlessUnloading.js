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

// Awaits a fetch or a read of its body. When it rejects while the page is
// unloading (watchPageUnload), the browser cancelled it on the way out: the
// request often reached the server and succeeded. Rejecting would run the
// action's catch actions and report a network failure that never happened, so
// the promise never settles instead, as the page is going away. A rejection
// while the page stays open is a real failure and still throws.
async function awaitUnlessUnloading({ lowdefy, promise }) {
  try {
    return await promise;
  } catch (error) {
    if (lowdefy.unloading === true) {
      return new Promise(() => {});
    }
    throw error;
  }
}

export default awaitUnlessUnloading;
