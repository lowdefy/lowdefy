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

// Whether `lowdefy test` runs headless, from --headless and --build: { headless } or { error }.
// --headless runs on a production build (--build) until the dev server can host a headless run.
function readHeadlessMode({ options }) {
  const headless = options.headless === true;
  const build = options.build === true;
  if (build && !headless) {
    return {
      error:
        '--build runs the headless journeys on the production build: pass --headless with it, as in "lowdefy test --headless --build".',
    };
  }
  if (headless && !build) {
    return {
      error:
        'lowdefy test --headless needs a running dev server to host it, which is not supported yet. Run "lowdefy build", then "lowdefy test --headless --build" to run the headless journeys on the production build.',
    };
  }
  return { headless };
}

export default readHeadlessMode;
