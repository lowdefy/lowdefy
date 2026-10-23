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

// Awaits a fetch or a read of its body. A rejection while the page is leaving
// is most likely the browser cancelling it on the way out, so it is held until
// the page either goes (it never settles) or stays (it throws) (createPageUnload).
// Throwing at once would run the action's catch actions and report a network
// failure that never happened. A rejection while the page stays open throws.
async function awaitUnlessUnloading({ lowdefy, promise }) {
  try {
    return await promise;
  } catch (error) {
    if (lowdefy.pageUnload.isLeaving()) {
      return lowdefy.pageUnload.hold(error);
    }
    throw error;
  }
}

export default awaitUnlessUnloading;
