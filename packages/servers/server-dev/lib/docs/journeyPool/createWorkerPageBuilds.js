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

// A journey worker thread's page builds (runJourneyHeadless, createDevServerHost): the main thread
// builds each page on its one JIT build context and keeps the context the build ran on for the
// length of the journey, so `built` is a handle to it, which jsEntries passes back. The thread
// never loads a build context of its own (createLocalPageBuilds is the main thread's).
function createWorkerPageBuilds({ calls }) {
  return {
    build: ({ pageId }) => calls.call('buildPage', { pageId }),
    jsEntries: ({ pageConfig, built }) => calls.call('pageJsEntries', { pageConfig, built }),
  };
}

export default createWorkerPageBuilds;
