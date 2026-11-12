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

// The router a headless page navigates with: it records each navigation and goes nowhere. Link
// and the auth methods push through it; following a push to the next page is the runner's.
function createRecordingRouter() {
  const navigations = [];
  return {
    basePath: '',
    navigations,
    back: () => {
      navigations.push({ method: 'back' });
    },
    push: (target) => {
      navigations.push({ method: 'push', ...target });
    },
    replace: (target) => {
      navigations.push({ method: 'replace', ...target });
    },
  };
}

export default createRecordingRouter;
